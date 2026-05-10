import { Hono } from "hono";
import { db } from "../db/client";
import projects from "./projects";

const tasks = new Hono();

tasks.get("/", async (c) => {
    const id = c.req.param("id")
    const tasks = await db.task.findMany({where: {projectId: id}});
    return c.json({data: tasks})
})

tasks.post

tasks.get

tasks.patch

tasks.delete

export default tasks
