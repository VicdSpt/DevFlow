import { z } from 'zod'

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MEMBER', 'VIEWER']),
})

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER', 'VIEWER']),
})
