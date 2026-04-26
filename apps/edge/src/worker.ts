export { TableDO } from "./do-table.js"

const ROOM_RE = /^[a-z0-9-]{1,64}$/

export interface Env {
  TABLE: DurableObjectNamespace
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, X-Owner-Token",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
}

function withCors(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(req.url)
    const parts = url.pathname.split("/").filter(Boolean)

    if (parts[0] === "c" && parts.length === 3 && (parts[2] === "mcp" || parts[2] === "ws")) {
      const room = parts[1]!
      if (!ROOM_RE.test(room)) return withCors(new Response("invalid room", { status: 400 }))
      const id = env.TABLE.idFromName(room)
      const res = await env.TABLE.get(id).fetch(req)
      // WS upgrade response (101) must not be wrapped — webSocket handle is lost.
      if (res.status === 101) return res
      return withCors(res)
    }

    if (parts[0] === "api" && parts[1] === "tables" && req.method === "POST") {
      const { handleCreateTable } = await import("./tables-api.js")
      return withCors(await handleCreateTable(req, env))
    }

    return withCors(new Response("not found", { status: 404 }))
  },
} satisfies ExportedHandler<Env>
