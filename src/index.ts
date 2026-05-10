import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import projects from './routes/projects'
import tasks from './routes/tasks'
import 'dotenv/config'

const app = new Hono()

app.get("/", ((c) => {
    return c.json({status: "ok"})
}))

app.route('/projects/:id/tasks', tasks)

serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3000
}, (info) => {
    console.log(`Serveur démarré sur http://localhost:${info.port}`)
})