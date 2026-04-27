export interface PresenceEntry {
  room: string
  sinceTs: number
  agentName: string
}

const PREFIX = "agent_presence"
const TTL_SEC = 60

function key(userId: string, agentId: string): string {
  return `${PREFIX}:${userId}:${agentId}`
}

export async function putPresence(
  kv: KVNamespace,
  userId: string,
  agentId: string,
  entry: PresenceEntry,
): Promise<void> {
  await kv.put(key(userId, agentId), JSON.stringify(entry), { expirationTtl: TTL_SEC })
}

export async function deletePresence(
  kv: KVNamespace,
  userId: string,
  agentId: string,
): Promise<void> {
  await kv.delete(key(userId, agentId))
}

export async function listPresenceByUser(
  kv: KVNamespace,
  userId: string,
): Promise<Array<{ agentId: string; entry: PresenceEntry }>> {
  const list = await kv.list({ prefix: `${PREFIX}:${userId}:` })
  const out: Array<{ agentId: string; entry: PresenceEntry }> = []
  for (const k of list.keys) {
    const agentId = k.name.split(":").pop()!
    const raw = await kv.get(k.name)
    if (!raw) continue
    out.push({ agentId, entry: JSON.parse(raw) as PresenceEntry })
  }
  return out
}
