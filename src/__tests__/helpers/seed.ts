import { db } from '../../db/client'

export type TestUser = { id: string; email: string; name: string | null }
export type TestProject = { id: string; name: string }
export type TestMember = { id: string; userId: string; projectId: string; role: string }

export type TestContext = {
  user: TestUser
  project: TestProject
  member: TestMember
}

export async function seed(): Promise<TestContext> {
  const user = await db.user.create({
    data: {
      email: 'owner@devflow.test',
      name: 'Owner User',
      emailVerified: false,
    },
  })
  const project = await db.project.create({
    data: {
      name: 'Test Project',
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })
  const member = await db.projectMember.findUniqueOrThrow({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  })
  return { user, project, member }
}

export async function cleanup(): Promise<void> {
  // Order matters: respect FK constraints
  await db.attachment.deleteMany()
  await db.task.deleteMany()
  await db.projectMember.deleteMany()
  await db.project.deleteMany()
  await db.session.deleteMany()
  await db.account.deleteMany()
  await db.user.deleteMany()
}
