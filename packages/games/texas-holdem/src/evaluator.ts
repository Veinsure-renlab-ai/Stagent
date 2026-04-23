import type { Card } from "./types.js"
import { rankValue } from "./card.js"

export enum HandCategory {
  HighCard = 1,
  OnePair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
}

export interface RankResult {
  category: HandCategory
  /** Tiebreakers: descending list of relevant rank values. */
  tiebreakers: number[]
}

export function rankFive(cards: [Card, Card, Card, Card, Card]): RankResult {
  const values = cards.map((c) => rankValue(c.rank)).sort((a, b) => b - a)
  const suits = cards.map((c) => c.suit)
  const isFlush = suits.every((s) => s === suits[0])

  // counts: rank-value -> count
  const counts = new Map<number, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  // sorted by (count desc, value desc)
  const groups = [...counts.entries()].sort((a, b) =>
    b[1] !== a[1] ? b[1] - a[1] : b[0] - a[0],
  )

  // straight detection (incl. wheel A-5 where A=14 acts as 1)
  const uniqDesc = [...new Set(values)].sort((a, b) => b - a)
  let straightHigh: number | null = null
  if (uniqDesc.length >= 5) {
    for (let i = 0; i + 4 < uniqDesc.length; i++) {
      if (uniqDesc[i]! - uniqDesc[i + 4]! === 4) {
        straightHigh = uniqDesc[i]!
        break
      }
    }
    // wheel: A,5,4,3,2
    if (
      straightHigh === null &&
      uniqDesc[0] === 14 &&
      uniqDesc.includes(5) && uniqDesc.includes(4) &&
      uniqDesc.includes(3) && uniqDesc.includes(2)
    ) {
      straightHigh = 5
    }
  }

  if (isFlush && straightHigh !== null) {
    return { category: HandCategory.StraightFlush, tiebreakers: [straightHigh] }
  }
  if (groups[0]![1] === 4) {
    return {
      category: HandCategory.FourOfAKind,
      tiebreakers: [groups[0]![0], groups[1]![0]],
    }
  }
  if (groups[0]![1] === 3 && groups[1]![1] === 2) {
    return {
      category: HandCategory.FullHouse,
      tiebreakers: [groups[0]![0], groups[1]![0]],
    }
  }
  if (isFlush) {
    return { category: HandCategory.Flush, tiebreakers: values }
  }
  if (straightHigh !== null) {
    return { category: HandCategory.Straight, tiebreakers: [straightHigh] }
  }
  if (groups[0]![1] === 3) {
    return {
      category: HandCategory.ThreeOfAKind,
      tiebreakers: [groups[0]![0], ...groups.slice(1).map((g) => g[0])],
    }
  }
  if (groups[0]![1] === 2 && groups[1]![1] === 2) {
    return {
      category: HandCategory.TwoPair,
      tiebreakers: [groups[0]![0], groups[1]![0], groups[2]![0]],
    }
  }
  if (groups[0]![1] === 2) {
    return {
      category: HandCategory.OnePair,
      tiebreakers: [groups[0]![0], ...groups.slice(1).map((g) => g[0])],
    }
  }
  return { category: HandCategory.HighCard, tiebreakers: values }
}
