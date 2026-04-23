import { createServer, type Server } from "node:http"
import { WebSocketServer, type WebSocket } from "ws"

export interface ServerDeps {
  port: number
  onWsConnection?: (ws: WebSocket) => void
}

export function createGameServer(deps: ServerDeps): { server: Server; close: () => Promise<void> } {
  const server = createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/plain" })
      res.end("ok")
      return
    }
    res.writeHead(404)
    res.end()
  })

  const wss = new WebSocketServer({ server, path: "/mcp" })
  wss.on("connection", (ws) => deps.onWsConnection?.(ws))

  return {
    server,
    close: () => new Promise<void>((resolve, reject) => {
      wss.close(() => server.close((err) => err ? reject(err) : resolve()))
    }),
  }
}

export async function listen(server: Server, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, () => resolve())
  })
}
