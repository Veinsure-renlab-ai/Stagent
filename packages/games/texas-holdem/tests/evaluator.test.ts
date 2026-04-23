import { describe, it, expect } from "vitest"
import { rankFive, HandCategory } from "../src/evaluator.js"
import { parseCard } from "../src/card.js"

const five = (s: string) => s.split(" ").map(parseCard) as [
  ReturnType<typeof parseCard>, ReturnType<typeof parseCard>,
  ReturnType<typeof parseCard>, ReturnType<typeof parseCard>,
  ReturnType<typeof parseCard>,
]

describe("rankFive: category", () => {
  it("straight flush", () => {
    const h = rankFive(five("9s 8s 7s 6s 5s"))
    expect(h.category).toBe(HandCategory.StraightFlush)
  })
  it("four of a kind", () => {
    const h = rankFive(five("Ah Ad Ac As 2h"))
    expect(h.category).toBe(HandCategory.FourOfAKind)
  })
  it("full house", () => {
    const h = rankFive(five("Kh Kd Kc 7s 7h"))
    expect(h.category).toBe(HandCategory.FullHouse)
  })
  it("flush", () => {
    const h = rankFive(five("Ah 9h 7h 5h 3h"))
    expect(h.category).toBe(HandCategory.Flush)
  })
  it("straight (ace high)", () => {
    const h = rankFive(five("Ah Kd Qc Jh Ts"))
    expect(h.category).toBe(HandCategory.Straight)
  })
  it("straight (wheel A-5)", () => {
    const h = rankFive(five("Ah 2d 3c 4h 5s"))
    expect(h.category).toBe(HandCategory.Straight)
  })
  it("three of a kind", () => {
    const h = rankFive(five("Qh Qd Qc 7s 4h"))
    expect(h.category).toBe(HandCategory.ThreeOfAKind)
  })
  it("two pair", () => {
    const h = rankFive(five("Jh Jd 4c 4s 9h"))
    expect(h.category).toBe(HandCategory.TwoPair)
  })
  it("one pair", () => {
    const h = rankFive(five("Th Td 8c 5s 3h"))
    expect(h.category).toBe(HandCategory.OnePair)
  })
  it("high card", () => {
    const h = rankFive(five("Ah Jd 8c 5s 3h"))
    expect(h.category).toBe(HandCategory.HighCard)
  })
})
