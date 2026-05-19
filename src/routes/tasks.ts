import { Hono } from "hono";
import { db } from "../db/client";
import { CreateTaskSchema, UpdateTaskSchema } from '../validators/tasks'

type Variables = { user: { id: string; email: string; name?: string | null } }

const tasks = new Hono<{ Variables: Variables }>();

async function verifyProjectOwner(projectId: string | undefined, userId: string) {
  if (!projectId) return null
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project) return null
  if (project.ownerId !== userId) return null
  return project
}

tasks.get("/", async (c) => {
  const user = c.get('user')
  const id = c.req.param("id");
  const project = await verifyProjectOwner(id, user.id)
  if (!project) return c.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404)
  const taskList = await db.task.findMany({ where: { projectId: id } });
  return c.json({ data: taskList });
});

tasks.post("/", async (c) => {
  const user = c.get('user')
  const id = c.req.param("id");
  const project = await verifyProjectOwner(id, user.id)
  if (!project) return c.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404)
  const body = await c.req.json();
  const result = CreateTaskSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 422);
  }
  const task = await db.task.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      priority: result.data.priority,
      dueDate: result.data.dueDate,
      projectId: id,
    },
  });
  return c.json({ data: task }, 201);
});

tasks.get("/:taskId", async (c) => {
  const user = c.get('user')
  const id = c.req.param("id");
  const project = await verifyProjectOwner(id, user.id)
  if (!project) return c.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404)
  const taskId = c.req.param("taskId");
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) return c.json({ error: { code: "NOT_FOUND", message: "Task not found" } }, 404);
  return c.json({ data: task });
});

tasks.patch("/:taskId", async (c) => {
  const user = c.get('user')
  const id = c.req.param("id");
  const project = await verifyProjectOwner(id, user.id)
  if (!project) return c.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404)
  const taskId = c.req.param("taskId");
  const body = await c.req.json();
  const result = UpdateTaskSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 422);
  }
  const task = await db.task.update({ where: { id: taskId }, data: result.data });
  return c.json({ data: task });
});

tasks.delete("/:taskId", async (c) => {
  const user = c.get('user')
  const id = c.req.param("id");
  const project = await verifyProjectOwner(id, user.id)
  if (!project) return c.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404)
  const taskId = c.req.param("taskId");
  await db.task.update({ where: { id: taskId }, data: { status: "ARCHIVED" } });
  return c.body(null, 204);
});

export default tasks;
