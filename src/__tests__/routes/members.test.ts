import { describe, it, expect, beforeEach, vi } from 'vitest'
import members from '../../routes/members'
import { db } from '../../db/client'
import { seed, cleanup, TestContext } from '../helpers/seed'
import { createTestApp } from '../helpers/testApp'

// Mock eventBus to avoid SSE side effects
vi.mock('../../lib/eventBus', () => ({
  eventBus: { emit: vi.fn() },
}))

describe('members routes', () => {
  let ctx: TestContext

  beforeEach(async () => {
    await cleanup()
    ctx = await seed()
  })

  // Helper: create a user with a role on the test project
  async function createUserWithRole(email: string, role: 'MEMBER' | 'VIEWER') {
    const user = await db.user.create({ data: { email, name: email, emailVerified: false } })
    await db.projectMember.create({
      data: { projectId: ctx.project.id, userId: user.id, role },
    })
    return user
  }

  // Helper: create a standalone user (not yet a member)
  async function createStandaloneUser(email: string) {
    return db.user.create({ data: { email, name: email, emailVerified: false } })
  }

  it('GET / — VIEWER can list members', async () => {
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/members', members, viewer)
    const res = await app.request(`/projects/${ctx.project.id}/members`)
    expect(res.status).toBe(200)
    const body = await res.json()
    // Should include at least the OWNER (ctx.user) and the VIEWER
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    const ownerEntry = body.data.find((m: any) => m.userId === ctx.user.id)
    expect(ownerEntry?.role).toBe('OWNER')
  })

  it('POST / — OWNER can add a MEMBER by email', async () => {
    const newUser = await createStandaloneUser('new@test.com')
    const app = createTestApp('/projects/:id/members', members, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUser.email, role: 'MEMBER' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.userId).toBe(newUser.id)
    expect(body.data.role).toBe('MEMBER')
  })

  it('POST / — MEMBER is forbidden to add members', async () => {
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const newUser = await createStandaloneUser('another@test.com')
    const app = createTestApp('/projects/:id/members', members, member)
    const res = await app.request(`/projects/${ctx.project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUser.email, role: 'VIEWER' }),
    })
    expect(res.status).toBe(403)
  })

  it('POST / — unknown email returns 404', async () => {
    const app = createTestApp('/projects/:id/members', members, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@nowhere.com', role: 'VIEWER' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('POST / — duplicate member returns 409', async () => {
    // ctx.user is already OWNER = already a member
    const app = createTestApp('/projects/:id/members', members, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ctx.user.email, role: 'VIEWER' }),
    })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe('CONFLICT')
  })

  it('PATCH /:userId — OWNER can change a member role', async () => {
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const app = createTestApp('/projects/:id/members', members, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'VIEWER' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.role).toBe('VIEWER')
  })

  it('PATCH /:userId — MEMBER is forbidden to change roles', async () => {
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/members', members, member)
    const res = await app.request(`/projects/${ctx.project.id}/members/${viewer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'MEMBER' }),
    })
    expect(res.status).toBe(403)
  })

  it('DELETE /:userId — OWNER can remove a member', async () => {
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const app = createTestApp('/projects/:id/members', members, ctx.user)
    const res = await app.request(`/projects/${ctx.project.id}/members/${member.id}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
    // Verify removed from DB
    const check = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: ctx.project.id, userId: member.id } },
    })
    expect(check).toBeNull()
  })

  it('DELETE /:userId — MEMBER is forbidden to remove members', async () => {
    const member = await createUserWithRole('member@test.com', 'MEMBER')
    const viewer = await createUserWithRole('viewer@test.com', 'VIEWER')
    const app = createTestApp('/projects/:id/members', members, member)
    const res = await app.request(`/projects/${ctx.project.id}/members/${viewer.id}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(403)
  })
})
