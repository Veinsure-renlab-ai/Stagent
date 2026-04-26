import type { Env } from "./worker.js"

function randId(bytes: number = 8): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, b => b.toString(16).padStart(2, "0")).join("")
}

export async function handleCreateTable(req: Request, env: Env): Promise<Response> {
  const slug = `prv-${randId(5)}`
  const token = randId(16)

  const id = env.TABLE.idFromName(slug)
  await env.TABLE.get(id).fetch(`http://edge/c/${slug}/__initPrivate`, {
    method: "POST",
    headers: { "X-Owner-Token": token },
  })

  const origin = new URL(req.url).origin
  return Response.json({
    // Absolute — agent's MCP client must hit the edge directly.
    mcpUrl: `${origin}/c/${slug}/mcp?t=${token}`,
    // Relative — web pairs with window.location.origin client-side, so it
    // resolves to the web frontend, not the edge host.
    watchUrl: `/c/${slug}`,
  }, { status: 201 })
}
