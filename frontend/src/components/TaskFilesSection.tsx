'use client'

import { useState } from 'react'
import type { Task } from '@/types/project'
import { useTaskFiles, useUploadTaskFile, useDeleteTaskFile } from '@/hooks/useFiles'
import { FileList } from './FileList'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface Props {
  projectId: string
  task: Task
  canUpload: boolean
  canDelete: boolean
}

export function TaskFilesSection({ projectId, task, canUpload, canDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { data: files = [] } = useTaskFiles(projectId, task.id, { enabled: expanded })
  const upload = useUploadTaskFile(projectId, task.id)
  const del = useDeleteTaskFile(projectId, task.id)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-gray-800/50"
      >
        <span className="text-white text-sm font-medium">{task.title}</span>
        <span className="text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <FileList
            files={files}
            canUpload={canUpload}
            canDelete={canDelete}
            isUploading={upload.isPending}
            onUpload={file => upload.mutate(file)}
            onDelete={fileId => del.mutate(fileId)}
            downloadBase={`${API_URL}/projects/${projectId}/tasks/${task.id}/files`}
          />
        </div>
      )}
    </div>
  )
}
