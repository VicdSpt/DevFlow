import { Hono } from 'hono'
import { db } from '../db/client'
import { requireProjectRole } from '../lib/projectAuth'
import { AddMemberSchema, UpdateMemberRoleSchema } from '../validators/members'
import { eventBus } from '../lib/eventBus'

type Variables = { user: { id: string; email: string; name?: string | null } }

const members = new Hono<{ Variables: Variables }>()

members.get('/', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response
  const memberList = await db.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ data: memberList })
})

members.post('/', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  const body = await c.req.json()
  const result = AddMemberSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 422)
  const targetUser = await db.user.findUnique({ where: { email: result.data.email } })
  if (!targetUser) return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)
  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: targetUser.id } },
  })
  if (existing) return c.json({ error: { code: 'CONFLICT', message: 'Already a member' } }, 409)
  const member = await db.projectMember.create({
    data: { projectId: id, userId: targetUser.id, role: result.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  const user = c.get('user')
  eventBus.emit(id, { type: 'member.added', actorName: user.name ?? user.email, projectId: id })
  return c.json({ data: member }, 201)
})

members.patch('/:userId', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  const userId = c.req.param('userId')
  const body = await c.req.json()
  const result = UpdateMemberRoleSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 422)
  const member = await db.projectMember.update({
    where: { projectId_userId: { projectId: id, userId } },
    data: { role: result.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return c.json({ data: member })
})

members.delete('/:userId', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  const userId = c.req.param('userId')
  const currentUser = c.get('user') as { id: string }
  if (userId === currentUser.id) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Cannot remove yourself' } }, 403)
  }
  await db.projectMember.delete({
    where: { projectId_userId: { projectId: id, userId } },
  })
  const user = c.get('user')
  eventBus.emit(id, { type: 'member.removed', actorName: user.name ?? user.email, projectId: id })
  return c.body(null, 204)
})

export default members
