import { produce } from "immer"
import type { TexasHoldemState, TexasHoldemAction, Seat } from "./types.js"
import type { AgentId, BroadcastEvent } from "@stagent/shared"

function findSeat(state: TexasHoldemState, by: AgentId): Seat {
  const s = state.seats.find((x) => x.agent_id === by)
  if (!s) throw new Error(`not_seated: ${by}`)
  return s
}

function nextActive(state: TexasHoldemState, from: number): number | null {
  const n = state.seats.length
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n
    const seat = state.seats[idx]!
    if (seat.status === "active") return idx
  }
  return null
}

function isStreetSettled(state: TexasHoldemState): boolean {
  const active = state.seats.filter((s) => s.status === "active")
  if (active.length <= 1) return true
  // every active seat must have matched current_bet
  return active.every((s) => s.contributed_this_street === state.current_bet)
}

export function applyAction(
  state: TexasHoldemState,
  action: TexasHoldemAction,
  by: AgentId,
): { state: TexasHoldemState; events: BroadcastEvent[] } {
  const seat = findSeat(state, by)
  if (state.to_act !== seat.index) throw new Error(`not_your_turn`)
  const events: BroadcastEvent[] = []

  const next = produce(state, (draft) => {
    const me = draft.seats[seat.index]!
    switch (action.kind) {
      case "fold":
        me.status = "folded"
        events.push({ kind: "action", payload: { by, kind: "fold" }, ts: Date.now() })
        break
      case "check":
        if (me.contributed_this_street !== draft.current_bet) {
          throw new Error(`illegal_action: cannot check, must call ${draft.current_bet}`)
        }
        events.push({ kind: "action", payload: { by, kind: "check" }, ts: Date.now() })
        break
      case "call": {
        const owe = draft.current_bet - me.contributed_this_street
        if (owe <= 0) throw new Error(`illegal_action: nothing to call`)
        const pay = Math.min(owe, me.chips)
        me.chips -= pay
        me.contributed_this_street += pay
        me.contributed_total += pay
        draft.pot_main += pay
        if (me.chips === 0) me.status = "all_in"
        events.push({
          kind: "action",
          payload: { by, kind: "call", amount: pay },
          ts: Date.now(),
        })
        break
      }
      default:
        throw new Error(`apply-action: kind ${(action as { kind: string }).kind} not implemented in this task`)
    }

    // advance to_act
    if (isStreetSettled(draft)) {
      draft.to_act = null   // street complete; transition handled in Task 11
    } else {
      draft.to_act = nextActive(draft, seat.index)
    }
  })

  return { state: next, events }
}
