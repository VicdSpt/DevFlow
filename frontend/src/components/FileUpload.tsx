'use client'

import { useRef, useState } from 'react'

const MAX_SIZE = 10 * 1024 * 1024

interface Props {
  onUpload: (file: File) => void
  isUploading: boolean
  disabled?: boolean
}

export function FileUpload({ onUpload, isUploading, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setError('Fichier trop lourd (max 10 Mo)')
      e.target.value = ''
      return
    }
    setError(null)
    onUpload(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        disabled={isUploading || disabled}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || disabled}
        className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer w-fit"
      >
        {isUploading ? 'Envoi...' : '📎 Joindre un fichier'}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
