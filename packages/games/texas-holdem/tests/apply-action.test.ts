import { describe, it, expect } from "vitest"
import { applyAction } from "../src/apply-action.js"
import { createTable } from "../src/state-init.js"
import { TexasHoldemModule } from "../src/index.js"

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

describe("applyAction: raise / all_in", () => {
  it("raise increases current_bet, deducts chips", () => {
    const s0 = newState()                // current_bet=10
    const { state: s1 } = applyAction(s0, { kind: "raise", amount: 30 }, "a1")
    expect(s1.current_bet).toBe(30)
    expect(s1.seats[0]!.chips).toBe(970)
    expect(s1.seats[0]!.contributed_this_street).toBe(30)
  })

  it("raise below min_raise is illegal", () => {
    const s0 = newState()                // current_bet=10, min_raise=10 → next raise must be >= 20
    expect(() => applyAction(s0, { kind: "raise", amount: 12 }, "a1")).toThrow(/invalid_amount/i)
  })

  it("raise more than chips is illegal (use all_in)", () => {
    const s0 = newState()
    expect(() => applyAction(s0, { kind: "raise", amount: 5000 }, "a1")).toThrow(/invalid_amount/i)
  })

  it("all_in puts all chips in, status becomes all_in", () => {
    const s0 = newState()
    const { state: s1 } = applyAction(s0, { kind: "all_in" }, "a1")
    expect(s1.seats[0]!.chips).toBe(0)
    expect(s1.seats[0]!.status).toBe("all_in")
    expect(s1.seats[0]!.contributed_this_street).toBe(1000)
  })
})

describe("applyAction: terminal state when no one can act", () => {
  it("all-fold hand reaches showdown in one applyAction and emits hand_ended", () => {
    // 3 players preflop; a1 calls, a2 folds, a3 (BB) folds,
    // then a1 folds while heads-up → 0 active remaining.
    let s = newState()
    ;({ state: s } = applyAction(s, { kind: "call" }, "a1"))
    ;({ state: s } = applyAction(s, { kind: "fold" }, "a2"))
    ;({ state: s } = applyAction(s, { kind: "fold" }, "a3"))
    // Only a1 active; now a1 folds.
    const { state: sEnd, events } = TexasHoldemModule.applyAction(s, { kind: "fold" }, "a1")
    expect(sEnd.street).toBe("showdown")
    expect(events.some((e) => e.kind === "hand_ended")).toBe(true)
  })
})
