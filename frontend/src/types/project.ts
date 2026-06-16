export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "DELETED"

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "ARCHIVED"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  projectId: string
  assigneeId?: string
  createdAt: string
  updatedAt: string
}
