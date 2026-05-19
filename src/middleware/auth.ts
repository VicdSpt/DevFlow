import { auth } from '../lib/auth'

export async function authMiddleware(c: any, next: any) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  })

  if (!session) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401)
  }

  c.set('user', session.user)
  await next()
}
