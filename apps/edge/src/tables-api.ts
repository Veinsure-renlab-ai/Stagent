import type { Env } from "./worker.js"
export async function handleCreateTable(_req: Request, _env: Env): Promise<Response> {
  return new Response("not implemented", { status: 501 })
}
