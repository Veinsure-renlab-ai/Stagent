import { describe, it, expect } from "vitest"
import { applyAction } from "../src/apply-action.js"
import { createTable } from "../src/state-init.js"

const newState = () =>
  createTable({
    seats: [
      { agent_id: "a1", chips: 1000 },
      { agent_id: "a2", chips: 1000 },
      { agent_id: "a3", chips: 1000 },
    ],
    rng_seed: "test-action",
    blinds: { sb: 5, bb: 10 },
  })

describe("applyAction: fold / check / call", () => {
  it("fold marks status folded and advances to next active seat", () => {
    const s0 = newState()
    const { state: s1 } = applyAction(s0, { kind: "fold" }, "a1")
    expect(s1.seats[0]!.status).toBe("folded")
    expect(s1.to_act).toBe(1)
  })

  it("call adds chips to match current_bet", () => {
    const s0 = newState()              // current_bet=10, a1 has put 0
    const { state: s1 } = applyAction(s0, { kind: "call" }, "a1")
    expect(s1.seats[0]!.chips).toBe(990)
    expect(s1.seats[0]!.contributed_this_street).toBe(10)
    expect(s1.pot_main).toBe(25)
  })

  it("check is illegal preflop with bet outstanding", () => {
    const s0 = newState()
    expect(() => applyAction(s0, { kind: "check" }, "a1")).toThrow(/illegal/i)
  })

  it("rejects action when not your turn", () => {
    const s0 = newState()
    expect(() => applyAction(s0, { kind: "fold" }, "a2")).toThrow(/not_your_turn/i)
  })
})
