import WebSocket from "ws"
import type { ToolName, ToolInput, ToolOutput } from "./schema.js"

interface Pending { resolve: (v: unknown) => void; reject: (e: Error) => void }

export interface WsClient {
  call<T extends ToolName>(name: T, args: ToolInput<T>): Promise<ToolOutput<T>>
  setOwnerToken(t: string): void
  close(): void
}

export async function createMcpClientWs(url: string): Promise<WsClient> {
  const ws = new WebSocket(url)
  const pending = new Map<string, Pending>()
  let seq = 0
  let ownerToken: string | null = null

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve())
    ws.once("error", reject)
  })

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      const p = pending.get(msg.id)
      if (!p) return
      pending.delete(msg.id)
      if (msg.error) p.reject(new Error(`${msg.error.code}: ${msg.error.message}`))
      else p.resolve(msg.result)
    } catch (e) {
      // ignore malformed frames
    }
  })

  return {
    call<T extends ToolName>(name: T, args: ToolInput<T>): Promise<ToolOutput<T>> {
      const id = String(++seq)
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
        ws.send(JSON.stringify({ id, method: name, params: args, owner_token: ownerToken }))
      })
    },
    setOwnerToken(t: string) { ownerToken = t },
    close() { ws.close() },
  }
}
