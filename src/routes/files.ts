import { Hono } from 'hono'
import { readFileSync } from 'fs'
import { db } from '../db/client'
import { requireProjectRole } from '../lib/projectAuth'
import { storage } from '../lib/storage'

const MAX_SIZE = 10 * 1024 * 1024

type Variables = { user: { id: string; email: string; name?: string | null } }

const files = new Hono<{ Variables: Variables }>()

files.get('/', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const attachments = await db.attachment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  })
  return c.json({ data: attachments })
})

files.post('/', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response

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
      projectId: id,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  })

  return c.json({ data: attachment }, 201)
})

files.get('/:fileId', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const fileId = c.req.param('fileId')
  const attachment = await db.attachment.findUnique({ where: { id: fileId } })
  if (!attachment || attachment.projectId !== id) {
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

files.delete('/:fileId', async (c) => {
  const id = c.req.param('id')
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response

  const fileId = c.req.param('fileId')
  const attachment = await db.attachment.findUnique({ where: { id: fileId } })
  if (!attachment || attachment.projectId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'File not found' } }, 404)
  }

  storage.delete(attachment.filename)
  await db.attachment.delete({ where: { id: fileId } })
  return new Response(null, { status: 204 })
})

export default files
