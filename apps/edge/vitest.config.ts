import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        singleWorker: true,
        isolatedStorage: false,
        miniflare: {
          d1Databases: { DB: ":memory:" },
          kvNamespaces: ["PRESENCE"],
        },
      },
    },
  },
})
