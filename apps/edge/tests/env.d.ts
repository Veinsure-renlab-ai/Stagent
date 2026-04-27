declare module "cloudflare:test" {
  interface ProvidedEnv {
    TABLE: DurableObjectNamespace
    DB: D1Database
    PRESENCE: KVNamespace
  }
}
