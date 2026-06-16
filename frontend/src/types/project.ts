export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "DELETED"
export type Role = "OWNER" | "MEMBER" | "VIEWER"

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  userRole?: Role
}

export interface CreateProjectInput {
  name: string
  description?: string
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: Role
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
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
