import type { D1Migration } from "@cloudflare/vitest-pool-workers/config"

declare module "cloudflare:test" {
  interface ProvidedEnv {
    TABLE: DurableObjectNamespace
    DB: D1Database
    PRESENCE: KVNamespace
    TEST_MIGRATIONS: D1Migration[]
  }
}
