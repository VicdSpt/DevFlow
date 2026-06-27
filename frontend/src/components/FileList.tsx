'use client'

import type { Attachment } from '@/types/project'
import { FileUpload } from './FileUpload'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

interface Props {
  files: Attachment[]
  canUpload: boolean
  canDelete: boolean
  isUploading: boolean
  onUpload: (file: File) => void
  onDelete: (fileId: string) => void
  downloadBase: string
}

export function FileList({ files, canUpload, canDelete, isUploading, onUpload, onDelete, downloadBase }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {files.length === 0 && (
        <p className="text-gray-500 text-sm py-2">Aucun fichier joint</p>
      )}
      {files.map(file => (
        <div
          key={file.id}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="text-white text-sm font-medium">{file.originalName}</p>
            <p className="text-gray-500 text-xs">
              {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString('fr-FR')}
              {file.uploadedBy && ` · ${file.uploadedBy.name ?? file.uploadedBy.email}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`${downloadBase}/${file.id}`}
              className="text-purple-400 hover:text-purple-300 text-xs"
            >
              Télécharger
            </a>
            {canDelete && (
              <button
                onClick={() => onDelete(file.id)}
                className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      ))}
      {canUpload && (
        <div className="mt-1">
          <FileUpload onUpload={onUpload} isUploading={isUploading} />
        </div>
      )}
    </div>
  )
}
