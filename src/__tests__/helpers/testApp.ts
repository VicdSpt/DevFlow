import type { Hono } from 'hono'

export type TestUser = { id: string; email: string; name?: string | null }

/**
 * Wraps a router with an auth middleware that injects `user` into context.
 * mountPath uses Hono param syntax, e.g. '/projects/:id/tasks'
 * so that c.req.param('id') works inside the router.
 */
export function createTestApp(
  mountPath: string,
  router: Hono<any>,
  user: TestUser
): Hono {
  const app = new Hono<{ Variables: { user: TestUser } }>()
  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })
  app.route(mountPath, router)
  return app
}
