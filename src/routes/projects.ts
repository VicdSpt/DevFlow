import { Hono } from "hono";
import { db } from "../db/client";

const projects = new Hono();

projects.get("/", async (c) => {
  const projects = await db.project.findMany();
  return c.json({ data: projects });
});

projects.post("/", async (c) => {
  const body = await c.req.json();
  const projects = await db.project.create({
    data: {
      name: body.name,
      ownerId: "user-1",
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
  const id = c.req.param("id");
  const projects = await db.project.update({ where: { id }, data: body });
  return c.json({ data: projects });
});

projects.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const projects = await db.project.update({ where: { id }, data: { status: 'DELETED' } });
  return c.body(null, 204);
});

export default projects;
