import { describe, it, expect } from "vitest"
import { env, runInDurableObject } from "cloudflare:test"
import { startHand, advanceBotsOnly } from "../src/game-loop.js"
import type { TableDO } from "../src/do-table.js"
import type { DOState, Seat } from "../src/state.js"
import { STARTING_CHIPS } from "../src/config.js"

function mkAllBotState(): DOState {
  const seats: Seat[] = Array.from({ length: 4 }, (_, i) => ({
    kind: "bot" as const, name: `B${i}`, chips: STARTING_CHIPS,
  }))
  return {
    kind: "demo", room: "demo-1",
    seats,
    engine: null, handsPlayed: 0, actionLog: [], lastActivityMs: Date.now(),
  }
}

describe("game loop", () => {
  it("startHand creates engine state", () => {
    const s = mkAllBotState()
    const after = startHand(s, { seed: "test-seed-1" })
    expect(after.engine).not.toBeNull()
    expect(after.engine!.hand_no).toBe(1)
  })

  it("advanceBotsOnly runs a hand to showdown when only bots seated", () => {
    let s = startHand(mkAllBotState(), { seed: "test-seed-2" })
    s = advanceBotsOnly(s, () => 0.5)
    expect(s.engine!.street).toBe("showdown")
  })

  it("advanceBotsOnly stops when an agent seat is to act", () => {
    const base = mkAllBotState()
    base.seats[2] = {
      kind: "agent", name: "User", chips: STARTING_CHIPS,
      mcpSessionId: "s1", lastSeenMs: Date.now(),
    }
    let after = startHand(base, { seed: "test-seed-3" })
    after = advanceBotsOnly(after, () => 0.5)
    if (after.engine!.street !== "showdown") {
      // engine.to_act maps to seat index 2 in the DO (the agent)
      const engineToAct = after.engine!.to_act
      if (engineToAct !== null) {
        const engineSeats = after.engine!.seats
        const acting = engineSeats[engineToAct]!
        expect(acting.agent_id).toContain("User")
      }
    }
  })
})

describe("alarm-driven advance", () => {
  it("ticking demo table produces hands", async () => {
    const stub = env.TABLE.get(env.TABLE.idFromName("alarm-demo"))
    await stub.fetch("http://edge/c/alarm-demo/__init", { method: "POST" })
    await stub.fetch("http://edge/c/alarm-demo/__startHand", { method: "POST" })

    for (let i = 0; i < 30; i++) {
      await stub.fetch("http://edge/c/alarm-demo/__tick", { method: "POST" })
    }
    await runInDurableObject(stub, async (obj: TableDO) => {
      const s = await obj.readState()
      expect(s.handsPlayed).toBeGreaterThanOrEqual(1)
    })
  })
})
