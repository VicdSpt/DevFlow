import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional()
});
