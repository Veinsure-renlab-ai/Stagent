import { RandomBot } from "./random.js"
import type { Persona } from "./types.js"

export { RandomBot }
export type { Persona }

export interface PersonaDeps {
  costGuard: import("../cost-guard.js").CostGuard
  anthropicKey?: string
  openaiKey?: string
}

export function buildPersonaRegistry(_deps: PersonaDeps): Record<string, Persona> {
  const out: Record<string, Persona> = { random: RandomBot }
  return out
}
