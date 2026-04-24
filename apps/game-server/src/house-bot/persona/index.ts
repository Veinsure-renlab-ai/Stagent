import { RandomBot } from "./random.js"
import { makeClaudeTightFromEnv } from "./claude-tight.js"
import { makeGptAggroFromEnv } from "./gpt-aggro.js"
import type { Persona } from "./types.js"
import type { CostGuard } from "../cost-guard.js"

export { RandomBot }
export type { Persona }

export interface PersonaDeps {
  costGuard: CostGuard
  anthropicKey?: string
  openaiKey?: string
}

export function buildPersonaRegistry(deps: PersonaDeps): Record<string, Persona> {
  const out: Record<string, Persona> = { random: RandomBot }
  if (deps.anthropicKey) {
    out["claude-tight"] = makeClaudeTightFromEnv({
      apiKey: deps.anthropicKey,
      costGuard: deps.costGuard,
    })
  }
  if (deps.openaiKey) {
    out["gpt-aggro"] = makeGptAggroFromEnv({
      apiKey: deps.openaiKey,
      costGuard: deps.costGuard,
    })
  }
  return out
}
