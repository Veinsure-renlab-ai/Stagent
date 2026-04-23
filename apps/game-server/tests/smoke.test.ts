import { describe, it, expect } from "vitest"
import { createGameServer, listen } from "../src/server.js"

describe("game-server smoke", () => {
  it("starts and responds to /health", async () => {
    const { server, close } = createGameServer({})
    await listen(server, 0)    // 0 = random free port
    const addr = server.address()
    const port = typeof addr === "object" && addr ? addr.port : 0
    const res = await fetch(`http://localhost:${port}/health`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("ok")
    await close()
  })
})
