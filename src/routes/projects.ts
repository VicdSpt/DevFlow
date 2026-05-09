import {Hono} from 'hono'
import {db} from '../db/client'

const projects = new Hono()

projects.get('/', async (c) => {
    const projects = await db.project.findMany()
    return c.json({data: projects})
})

export default projects