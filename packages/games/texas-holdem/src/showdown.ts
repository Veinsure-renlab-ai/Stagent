import type { TexasHoldemState } from "./types.js"
import { bestOfSeven, compareHands } from "./evaluator.js"
import type { AgentId } from "@stagent/shared"

export interface WinnerShare {
  agent_id: AgentId
  won: number
}

export function resolveShowdown(state: TexasHoldemState): WinnerShare[] {
  const inHand = state.seats.filter((s) => s.status !== "folded" && s.status !== "sitting_out")

  if (inHand.length === 1) {
    return [{ agent_id: inHand[0]!.agent_id, won: state.pot_main }]
  }

  const ranked = inHand.map((s) => ({
    seat: s,
    rank: bestOfSeven([...s.hole_cards!, ...state.board]),
  }))

  // Find best
  ranked.sort((a, b) => compareHands(b.rank, a.rank))
  const best = ranked[0]!.rank
  const tied = ranked.filter((r) => compareHands(r.rank, best) === 0)

  const share = Math.floor(state.pot_main / tied.length)
  const remainder = state.pot_main - share * tied.length

  return tied.map((t, i) => ({
    agent_id: t.seat.agent_id,
    won: share + (i === 0 ? remainder : 0),    // odd chip to first by seat order
  }))
}
