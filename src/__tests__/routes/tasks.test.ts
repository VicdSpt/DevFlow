import { describe, it, expect, beforeEach, vi } from 'vitest'
import tasks from '../../routes/tasks'
import { db } from '../../db/client'
import { seed, cleanup, TestContext } from '../helpers/seed'
import { createTestApp } from '../helpers/testApp'

// Mock Redis cache to avoid needing a running Redis instance
vi.mock('../../lib/cache', () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delPattern: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock eventBus to avoid SSE side effects
vi.mock('../../lib/eventBus', () => ({
  eventBus: { emit: vi.fn() },
}))

describe('tasks routes', () => {
  let ctx: TestContext

  beforeEach(async () => {
    await cleanup()
    ctx = await seed()
  })

  // Helper: create a second user with a given role
  async function createUserWithRole(email: string, role: 'MEMBER' | 'VIEWER') {
    const user = await db.user.create({ data: { email, name: email, emailVerified: false } })
    await db.projectMember.create({
      data: { projectId: ctx.project.id, userId: user.id, role },
    })
    return user
  }

  // Helper: create a task in the test project
  async function createTask(title = 'Test task') {
    return db.task.create({ data: { title, projectId: ctx.project.id } })
  }

  it('GET / — VIEWER can list tasks (returns empty array)', async () => {
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/tasks', tasks, viewer)
    const res = await app.request(`/projects/${ctx.project.id}/tasks`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.pagination.total).toBe(0)
  })

  it('GET / — respects ?limit query param', async () => {
    await createTask('Task A')
    await createTask('Task B')
    await createTask('Task C')
    const app = createTestApp('/projects/:id/tasks', tasks, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/tasks?limit=2`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBeLessThanOrEqual(2)
    expect(body.pagination.limit).toBe(2)
  })

  it('POST / — MEMBER can create a task', async () => {
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const app = createTestApp('/projects/:id/tasks', tasks, member)
    const res = await app.request(`/projects/${ctx.project.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Ma tâche' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.title).toBe('Ma tâche')
    expect(body.data.projectId).toBe(ctx.project.id)
  })

  it('POST / — VIEWER is forbidden', async () => {
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/tasks', tasks, viewer)
    const res = await app.request(`/projects/${ctx.project.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized' }),
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('POST / — empty body returns 422', async () => {
    const app = createTestApp('/projects/:id/tasks', tasks, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(422)
  })

  it('PATCH /:taskId — MEMBER can update status', async () => {
    const task = await createTask()
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const app = createTestApp('/projects/:id/tasks', tasks, member)
    const res = await app.request(`/projects/${ctx.project.id}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('IN_PROGRESS')
  })

  it('PATCH /:taskId — VIEWER is forbidden', async () => {
    const task = await createTask()
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/tasks', tasks, viewer)
    const res = await app.request(`/projects/${ctx.project.id}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    })
    expect(res.status).toBe(403)
  })

  it('PATCH /:taskId — missing task returns 404', async () => {
    const app = createTestApp('/projects/:id/tasks', tasks, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/tasks/nonexistent-id`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('DELETE /:taskId — OWNER can archive a task', async () => {
    const task = await createTask()
    const app = createTestApp('/projects/:id/tasks', tasks, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/tasks/${task.id}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
    // Verify task is archived in DB, not hard deleted
    const updated = await db.task.findUnique({ where: { id: task.id } })
    expect(updated?.status).toBe('ARCHIVED')
  })

  it('DELETE /:taskId — VIEWER is forbidden', async () => {
    const task = await createTask()
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/tasks', tasks, viewer)
    const res = await app.request(`/projects/${ctx.project.id}/tasks/${task.id}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(403)
  })
})
