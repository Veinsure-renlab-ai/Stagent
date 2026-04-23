import { describe, it, expect } from "vitest"
import { resolveShowdown } from "../src/showdown.js"
import type { TexasHoldemState } from "../src/types.js"
import { parseCard } from "../src/card.js"

const baseState = (): TexasHoldemState => ({
  seats: [
    {
      index: 0, agent_id: "a1", chips: 0,
      hole_cards: [parseCard("As"), parseCard("Ah")],
      contributed_this_street: 0, contributed_total: 100, status: "active",
      has_acted_this_street: true,
    },
    {
      index: 1, agent_id: "a2", chips: 0,
      hole_cards: [parseCard("2c"), parseCard("7d")],
      contributed_this_street: 0, contributed_total: 100, status: "active",
      has_acted_this_street: true,
    },
  ],
  button: 0, street: "river", board: ["Kh", "5d", "2s", "9c", "Tc"].map(parseCard),
  pot_main: 200, pots: [], current_bet: 0, min_raise: 10, to_act: null,
  blinds: { sb: 5, bb: 10 }, hand_no: 1, rng_seed: "x", rng_state: "0",
  deck_remaining: [], history: [],
})

describe("resolveShowdown", () => {
  it("higher pair wins whole pot", () => {
    const s = baseState()
    const winners = resolveShowdown(s)
    expect(winners).toEqual([{ agent_id: "a1", won: 200 }])
  })

  it("fold-to-one player gives pot to remaining player", () => {
    const s = baseState()
    s.seats[1]!.status = "folded"
    const winners = resolveShowdown(s)
    expect(winners).toEqual([{ agent_id: "a1", won: 200 }])
  })

  it("split pot when hands tie", () => {
    const s = baseState()
    s.seats[1]!.hole_cards = [parseCard("Ad"), parseCard("Ac")]
    s.board = ["2h", "5d", "9s", "Jc", "Qc"].map(parseCard)
    const winners = resolveShowdown(s)
    // Both have AA + same kickers from board
    expect(winners).toHaveLength(2)
    expect(winners[0]!.won + winners[1]!.won).toBe(200)
  })
})
