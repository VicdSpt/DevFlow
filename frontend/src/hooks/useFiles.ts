'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Attachment } from '@/types/project'

export function useProjectFiles(projectId: string) {
  return useQuery<Attachment[]>({
    queryKey: ['files', 'project', projectId],
    queryFn: () => api.get(`/projects/${projectId}/files`).then(r => r.data.data),
  })
}

export function useUploadProjectFile(projectId: string) {
  const qc = useQueryClient()
  return useMutation<Attachment, unknown, File>({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post(`/projects/${projectId}/files`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'project', projectId] }),
  })
}

export function useDeleteProjectFile(projectId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (fileId: string) => api.delete(`/projects/${projectId}/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'project', projectId] }),
  })
}

export function useTaskFiles(projectId: string, taskId: string, opts?: { enabled?: boolean }) {
  return useQuery<Attachment[]>({
    queryKey: ['files', 'task', taskId],
    queryFn: () => api.get(`/projects/${projectId}/tasks/${taskId}/files`).then(r => r.data.data),
    enabled: opts?.enabled ?? true,
  })
}

export function useUploadTaskFile(projectId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation<Attachment, unknown, File>({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post(`/projects/${projectId}/tasks/${taskId}/files`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'task', taskId] }),
  })
}

export function useDeleteTaskFile(projectId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (fileId: string) => api.delete(`/projects/${projectId}/tasks/${taskId}/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', 'task', taskId] }),
  })
}
