import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/client'

export function errorHandler(err: Error, c: any) {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } }, 404)
    }
    if (err.code === 'P2002') {
      return c.json({ error: { code: 'CONFLICT', message: 'Resource already exists' } }, 409)
    }
  }

  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500)

}
