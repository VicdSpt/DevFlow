import { Hono } from "hono"
import { db } from "../db/client"
import { CreateTaskSchema, UpdateTaskSchema } from '../validators/tasks'
import { requireProjectRole } from '../lib/projectAuth'
import { cache } from '../lib/cache'
import { eventBus } from '../lib/eventBus'

type Variables = { user: { id: string; email: string; name?: string | null } }

const tasks = new Hono<{ Variables: Variables }>()

tasks.get("/", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const rawPage = parseInt(c.req.query('page') ?? '', 10)
  const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage)
  const rawLimit = parseInt(c.req.query('limit') ?? '', 10)
  const limit = isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit))

  const cacheKey = `tasks:${id}:${page}:${limit}`
  const cached = await cache.get(cacheKey)
  if (cached) return c.json(cached)

  const skip = (page - 1) * limit
  const [taskList, total] = await Promise.all([
    db.task.findMany({
      where: { projectId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.task.count({ where: { projectId: id } }),
  ])

  const response = {
    data: taskList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }

  await cache.set(cacheKey, response, 300)
  return c.json(response)
})

tasks.post("/", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const body = await c.req.json()
  const result = CreateTaskSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 422)
  const task = await db.task.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      priority: result.data.priority,
      dueDate: result.data.dueDate,
      projectId: id,
    },
  })
  await cache.delPattern(`tasks:${id}:*`)
  const user = c.get('user')
  eventBus.emit(id, { type: 'task.created', actorName: user.name ?? user.email, projectId: id })
  return c.json({ data: task }, 201)
})

tasks.get("/:taskId", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response
  const taskId = c.req.param("taskId")
  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) return c.json({ error: { code: "NOT_FOUND", message: "Task not found" } }, 404)
  return c.json({ data: task })
})

tasks.patch("/:taskId", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const taskId = c.req.param("taskId")
  const body = await c.req.json()
  const result = UpdateTaskSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 422)
  try {
    const task = await db.task.update({ where: { id: taskId }, data: result.data })
    await cache.delPattern(`tasks:${id}:*`)
    const user = c.get('user')
    eventBus.emit(id, { type: 'task.updated', actorName: user.name ?? user.email, projectId: id })
    return c.json({ data: task })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404)
    }
    throw e
  }
})

tasks.delete("/:taskId", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const taskId = c.req.param("taskId")
  try {
    await db.task.update({ where: { id: taskId }, data: { status: "ARCHIVED" } })
    await cache.delPattern(`tasks:${id}:*`)
    const user = c.get('user')
    eventBus.emit(id, { type: 'task.deleted', actorName: user.name ?? user.email, projectId: id })
    return c.body(null, 204)
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404)
    }
    throw e
  }
})

export default tasks
