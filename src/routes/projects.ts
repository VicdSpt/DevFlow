import { Hono } from "hono";
import { db } from "../db/client";
import { CreateProjectSchema, UpdateProjectSchema } from '../validators/projects'


type Variables = { user: { id: string; email: string; name?: string | null } }

const projects = new Hono<{ Variables: Variables }>();

projects.get("/", async (c) => {
  const user = c.get('user')
  const projects = await db.project.findMany({ where: { ownerId: user.id } });
  return c.json({ data: projects });
});

projects.post("/", async (c) => {
  const user = c.get('user')
  const body = await c.req.json();
  const result = CreateProjectSchema.safeParse(body)
  if(!result.success){
    return c.json({error: result.error.flatten()}, 422)
  }
  const projects = await db.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      ownerId: user.id,
    },
  });
  return c.json({ data: projects }, 201);
});

projects.get("/:id", async (c) => {
  const id = c.req.param("id");
  const projects = await db.project.findUnique({ where: { id } });
  if (!projects)
    return c.json(
      { error: { code: "NOT_FOUND", message: "Project not found" } },
      404,
    );
  return c.json({ data: projects });
});

projects.patch("/:id", async (c) => {
  const body = await c.req.json();
  const result = UpdateProjectSchema.safeParse(body)
  if(!result.success){
    return c.json({error: result.error.flatten()}, 422)
  }
  const id = c.req.param("id");
  const projects = await db.project.update({ where: { id }, data: result.data });
  return c.json({ data: projects });
});

projects.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const projects = await db.project.update({ where: { id }, data: { status: 'DELETED' } });
  return c.body(null, 204);
});

export default projects;
