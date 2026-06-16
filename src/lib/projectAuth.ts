import { Context } from 'hono'
import { db } from '../db/client'

type Role = 'OWNER' | 'MEMBER' | 'VIEWER'

const ROLE_RANK: Record<Role, number> = { VIEWER: 0, MEMBER: 1, OWNER: 2 }

export async function requireProjectRole(
  c: Context,
  projectId: string,
  minRole: Role
) {
  const user = c.get('user') as { id: string }
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })
  if (!member || ROLE_RANK[member.role as Role] < ROLE_RANK[minRole]) {
    return {
      ok: false as const,
      response: c.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, 403),
    }
  }
  return { ok: true as const, member }
}
