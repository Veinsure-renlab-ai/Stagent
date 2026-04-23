import { loadConfig } from "./config.js"
import { createGameServer, listen } from "./server.js"

async function main() {
  const config = loadConfig()
  const { server } = createGameServer({ port: config.port })
  await listen(server, config.port)
  console.log(`game-server listening on :${config.port}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
