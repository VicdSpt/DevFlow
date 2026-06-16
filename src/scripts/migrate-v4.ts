import { db } from '../db/client'

async function main() {
  const projects = await db.project.findMany({ select: { id: true, ownerId: true } })
  for (const project of projects) {
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: project.ownerId } },
      update: {},
      create: { projectId: project.id, userId: project.ownerId, role: 'OWNER' },
    })
  }
  console.log(`Migrated ${projects.length} projects`)
}

main().catch(console.error).finally(() => db.$disconnect())
