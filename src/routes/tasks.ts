import { Hono } from "hono"
import { db } from "../db/client"
import { CreateTaskSchema, UpdateTaskSchema } from '../validators/tasks'
import { requireProjectRole } from '../lib/projectAuth'

type Variables = { user: { id: string; email: string; name?: string | null } }

const tasks = new Hono<{ Variables: Variables }>()

tasks.get("/", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response
  const taskList = await db.task.findMany({ where: { projectId: id } })
  return c.json({ data: taskList })
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
  const task = await db.task.update({ where: { id: taskId }, data: result.data })
  return c.json({ data: task })
})

tasks.delete("/:taskId", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'MEMBER')
  if (!auth.ok) return auth.response
  const taskId = c.req.param("taskId")
  await db.task.update({ where: { id: taskId }, data: { status: "ARCHIVED" } })
  return c.body(null, 204)
})

export default tasks
