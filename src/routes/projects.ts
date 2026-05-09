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
  return c.json({data: projects }, 201);
});

export default projects;
