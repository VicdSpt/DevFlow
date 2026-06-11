export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "DELETED"

export interface Project {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string
}

export interface CreateProjectInput {
    name: string;
    description?: string;
}
