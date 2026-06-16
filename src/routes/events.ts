import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { requireProjectRole } from '../lib/projectAuth'
import { eventBus } from '../lib/eventBus'

type Variables = { user: { id: string; email: string; name?: string | null } }

const events = new Hono<{ Variables: Variables }>()

events.get('/', async (c) => {
  const id = c.req.param('id')
  if (!id) return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing project id' } }, 400)
  const auth = await requireProjectRole(c, id, 'VIEWER')
  if (!auth.ok) return auth.response

  return streamSSE(c, async (stream) => {
    const unsubscribe = eventBus.subscribe(id, (payload) => {
      stream.writeSSE({ data: JSON.stringify(payload) }).catch(() => {})
    })

    try {
      while (!stream.aborted) {
        await stream.writeSSE({ event: 'heartbeat', data: '' }).catch(() => {})
        await stream.sleep(30_000)
      }
    } finally {
      unsubscribe()
    }
  })
})

export default events
