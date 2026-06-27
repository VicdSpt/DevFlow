import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileList } from '@/components/FileList'
import type { Attachment } from '@/types/project'

function makeFile(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: 'file-1',
    filename: 'abc123.pdf',
    originalName: 'rapport.pdf',
    mimeType: 'application/pdf',
    size: 204800, // 200.0 Ko
    createdAt: '2026-06-27T10:00:00.000Z',
    projectId: 'proj-1',
    taskId: null,
    uploadedById: 'user-1',
    uploadedBy: { id: 'user-1', name: 'Alice', email: 'alice@test.com' },
    ...overrides,
  }
}

const defaultProps = {
  canUpload: false,
  canDelete: false,
  isUploading: false,
  onUpload: vi.fn(),
  onDelete: vi.fn(),
  downloadBase: 'http://localhost:3000/projects/proj-1/files',
}

describe('FileList', () => {
  it('shows "Aucun fichier joint" when files array is empty', () => {
    render(<FileList {...defaultProps} files={[]} />)
    expect(screen.getByText(/aucun fichier joint/i)).toBeInTheDocument()
  })

  it('displays originalName and formatted size for each file', () => {
    render(<FileList {...defaultProps} files={[makeFile()]} />)
    expect(screen.getByText('rapport.pdf')).toBeInTheDocument()
    expect(screen.getByText(/200\.0 Ko/)).toBeInTheDocument()
  })

  it('shows Supprimer button and calls onDelete when canDelete is true', () => {
    const onDelete = vi.fn()
    render(<FileList {...defaultProps} files={[makeFile()]} canDelete={true} onDelete={onDelete} />)
    const btn = screen.getByRole('button', { name: /supprimer/i })
    fireEvent.click(btn)
    expect(onDelete).toHaveBeenCalledWith('file-1')
  })

  it('hides Supprimer button when canDelete is false', () => {
    render(<FileList {...defaultProps} files={[makeFile()]} canDelete={false} />)
    expect(screen.queryByRole('button', { name: /supprimer/i })).not.toBeInTheDocument()
  })

  it('shows FileUpload area when canUpload is true', () => {
    render(<FileList {...defaultProps} files={[]} canUpload={true} />)
    expect(screen.getByRole('button', { name: /joindre un fichier/i })).toBeInTheDocument()
  })

  it('hides FileUpload area when canUpload is false', () => {
    render(<FileList {...defaultProps} files={[]} canUpload={false} />)
    expect(screen.queryByRole('button', { name: /joindre un fichier/i })).not.toBeInTheDocument()
  })
})
