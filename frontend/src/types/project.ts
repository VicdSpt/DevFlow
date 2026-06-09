type ProjectStatus = "ACTIVE" | "ARCHIVED" | "DELETED"

interface Project {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string
}

interface CreateProjectInput {
    name: string;
    description?: string;
}