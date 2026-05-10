import { Hono } from "hono";
import { db } from "../db/client";
import projects from "./projects";

const tasks = new Hono();

tasks.get("/", async (c) => {
    const id = c.req.param("id")
    const tasks = await db.task.findMany({where: {projectId: id}});
    return c.json({data: tasks})
})

tasks.post("/", async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json();
    const tasks = await db.task.create({
        data:{
            title: body.title,
            projectId: id
        }
    })
    return c.json({data: tasks}, 201)
})

tasks.get("/:taskId", async (c) => {
    const taskId  = c.req.param("taskId")
    const tasks = await db.task.findUnique({where: {id: taskId}})
    if (!tasks)
    return c.json(
      { error: { code: "NOT_FOUND", message: "Project not found" } },
      404,
    );
  return c.json({ data: tasks });
})

tasks.patch('/:taskId', async (c) => {
  const taskId = c.req.param('taskId')
  const body = await c.req.json()
  const task = await db.task.update({ where: { id: taskId }, data: body })
  return c.json({ data: task })
})

tasks.delete('/:taskId', async (c) => {
  const taskId = c.req.param('taskId')
  await db.task.update({ where: { id: taskId }, data: { status: 'ARCHIVED' } })
  return c.body(null, 204)
})

export default tasks
