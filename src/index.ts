import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import projects from './routes/projects'
import tasks from './routes/tasks'
import 'dotenv/config'
import { errorHandler } from './middleware/errorHandler'
import {auth} from "./lib/auth"
import { authMiddleware } from './middleware/auth'


const app = new Hono()

app.get("/", ((c) => {
    return c.json({status: "ok"})
}))

app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

app.use('/projects/*', authMiddleware)

app.route('/projects/:id/tasks', tasks)
app.route('/projects', projects)
app.onError(errorHandler)

serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3000
}, (info) => {
    console.log(`Serveur démarré sur http://localhost:${info.port}`)
})