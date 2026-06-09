import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import { cors } from 'hono/cors'
import projects from './routes/projects'
import tasks from './routes/tasks'
import 'dotenv/config'
import { errorHandler } from './middleware/errorHandler'
import {auth} from "./lib/auth"
import { authMiddleware } from './middleware/auth'


const app = new Hono()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

app.options('*', (c) => {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
})

app.use('*', cors({
  origin: 'http://localhost:3001',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

app.get("/", ((c) => {
    return c.json({status: "ok"})
}))

app.on(['GET', 'POST', 'OPTIONS'], '/api/auth/**', async (c) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }
    })
  }
  const response = await auth.handler(c.req.raw)
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true')
  return newResponse
})

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