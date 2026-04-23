import { LoopbackTransport, type LoopbackConnection } from "@stagent/mcp-tools"
import type { Db } from "../db/client.js"
import type { TableRegistry } from "../actors/table-registry.js"
import { createHandler } from "../mcp/handler.js"

async function loopPlay(client: LoopbackConnection, table_id: string) {
  while (true) {
    const turn = await client.call("wait_for_my_turn", { table_id, timeout_s: 5 })
    if (turn.kind === "timeout") continue
    const pick = turn.legal_actions.find((a) => a.kind === "check")
              ?? turn.legal_actions.find((a) => a.kind === "call")
              ?? ({ kind: "fold" } as const)
    await client.call(`texas_holdem.${pick.kind}`, {} as any)
  }
}

/**
 * Wire a direct in-process connection to the MCP handler.
 * The handler expects `conn.ws` but we fake it: the wire function only
 * invokes `dispatch`, never uses the WebSocket object itself.
 */
export async function spawnDumbBotLoopback(deps: { db: Db; registry: TableRegistry; name: string }): Promise<void> {
  const handler = createHandler({ db: deps.db, registry: deps.registry })
  const transport = new LoopbackTransport()

  // Adapter: LoopbackTransport's ToolHandler signature is (name, args, connId)
  // but our handler expects (conn, frame). We maintain a single pseudo-connection.
  const conn = {
    id: `loopback-${deps.name}`,
    ws: null as any,    // unused by dispatch; auth check uses owner_token
    agent_id: null as string | null,
    owner_token: null as string | null,
  }
  transport.bindHandler(async (method, params) => {
    const frame: any = { id: "0", method, params }
    if (conn.owner_token) frame.owner_token = conn.owner_token
    const resp = await handler(conn as any, frame)
    if (resp.error) throw new Error(`${resp.error.code}: ${resp.error.message}`)
    return resp.result
  })

  const client = transport.connect()
  const { agent_id, owner_token } = await client.call("register_agent", { name: deps.name })
  client.setOwnerToken(owner_token)
  conn.owner_token = owner_token
  conn.agent_id = agent_id ?? ""

  const tables = await client.call("list_tables", { game: "texas_holdem", status: "live" })
  if (tables.length === 0) throw new Error("no tables to join")
  // Pick first table with an open seat
  let joined = false
  for (const t of tables) {
    try {
      await client.call("join_table", { table_id: t.id })
      await loopPlay(client, t.id)
      joined = true
      break
    } catch (e) {
      if ((e as Error).message.includes("table_full") || (e as Error).message.includes("already_seated_here")) continue
      throw e
    }
  }
  if (!joined) throw new Error("no table available")
}
