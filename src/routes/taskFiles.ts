import { Hono } from 'hono'
import { readFileSync } from 'fs'
import { db } from '../db/client'
import { requireProjectRole } from '../lib/projectAuth'
import { storage } from '../lib/storage'

const MAX_SIZE = 10 * 1024 * 1024

type Variables = { user: { id: string; email: string; name?: string | null } }

const taskFiles = new Hono<{ Variables: Variables }>()

taskFiles.get('/', async (c) => {
  const id = c.req.param('id')
  const taskId = c.req.param('taskId')
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.projectId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404)
  }

  const attachments = await db.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  })
  return c.json({ data: attachments })
})

taskFiles.post('/', async (c) => {
  const id = c.req.param('id')
  const taskId = c.req.param('taskId')
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.projectId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404)
  }

  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file === 'string') {
    return c.json({ error: { code: 'MISSING_FILE', message: 'No file provided' } }, 422)
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 10 MB limit' } }, 413)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = storage.save(buffer, file.name)
  const user = c.get('user')

  const attachment = await db.attachment.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      taskId,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  })

  return c.json({ data: attachment }, 201)
})

taskFiles.get('/:fileId', async (c) => {
  const id = c.req.param('id')
  const taskId = c.req.param('taskId')
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.projectId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404)
  }

  const fileId = c.req.param('fileId')
  const attachment = await db.attachment.findUnique({ where: { id: fileId } })
  if (!attachment || attachment.taskId !== taskId) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'File not found' } }, 404)
  }

  const buffer = readFileSync(storage.getPath(attachment.filename))
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
    },
  })
})

taskFiles.delete('/:fileId', async (c) => {
  const id = c.req.param('id')
  const taskId = c.req.param('taskId')
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task || task.projectId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404)
  }

  const fileId = c.req.param('fileId')
  const attachment = await db.attachment.findUnique({ where: { id: fileId } })
  if (!attachment || attachment.taskId !== taskId) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'File not found' } }, 404)
  }

  storage.delete(attachment.filename)
  await db.attachment.delete({ where: { id: fileId } })
  return new Response(null, { status: 204 })
})

export default taskFiles
