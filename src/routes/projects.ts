import { Hono } from "hono";
import { db } from "../db/client";
import { CreateProjectSchema, UpdateProjectSchema } from '../validators/projects'
import { requireProjectRole } from '../lib/projectAuth'
import { cache } from '../lib/cache'

type Variables = { user: { id: string; email: string; name?: string | null } }

const projects = new Hono<{ Variables: Variables }>();

projects.get("/", async (c) => {
  const user = c.get('user')
  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: { project: true },
  })
  const data = memberships
    .filter(m => m.project.status !== 'DELETED')
    .map(m => ({ ...m.project, userRole: m.role }))
  return c.json({ data })
});

projects.post("/", async (c) => {
  const user = c.get('user')
  const body = await c.req.json();
  const result = CreateProjectSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 422)
  }
  const project = await db.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })
  return c.json({ data: project }, 201);
});

projects.get("/:id", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  const cacheKey = `project:${id}`
  const cached = await cache.get(cacheKey)
  if (cached) return c.json({ data: { ...(cached as object), userRole: auth.member.role } })

  const project = await db.project.findUnique({ where: { id } })
  if (!project)
    return c.json({ error: { code: "NOT_FOUND", message: "Project not found" } }, 404)

  await cache.set(cacheKey, project, 300)
  return c.json({ data: { ...project, userRole: auth.member.role } })
});

projects.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  const body = await c.req.json();
  const result = UpdateProjectSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 422)
  }
  const project = await db.project.update({ where: { id }, data: result.data })
  await cache.del(`project:${id}`)
  return c.json({ data: project })
});

projects.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const auth = await requireProjectRole(c, id, 'OWNER')
  if (!auth.ok) return auth.response
  await db.project.update({ where: { id }, data: { status: 'DELETED' } })
  await cache.del(`project:${id}`)
  return c.body(null, 204)
});

export default projects;
