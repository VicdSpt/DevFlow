import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskFilesSection } from '@/components/TaskFilesSection'
import type { Task } from '@/types/project'

// Mock all hooks from useFiles to control their output
vi.mock('@/hooks/useFiles', () => ({
  useTaskFiles: vi.fn(() => ({ data: [] })),
  useUploadTaskFile: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteTaskFile: vi.fn(() => ({ mutate: vi.fn() })),
}))

const mockTask: Task = {
  id: 'task-1',
  title: 'Implémenter login',
  status: 'TODO',
  priority: 'MEDIUM',
  projectId: 'proj-1',
  createdAt: '2026-06-27T10:00:00.000Z',
  updatedAt: '2026-06-27T10:00:00.000Z',
}

const defaultProps = {
  projectId: 'proj-1',
  task: mockTask,
  canUpload: false,
  canDelete: false,
}

describe('TaskFilesSection', () => {
  it('starts collapsed — file list is not visible', () => {
    render(<TaskFilesSection {...defaultProps} />)
    // The task title button is visible
    expect(screen.getByRole('button', { name: /implémenter login/i })).toBeInTheDocument()
    // But no file-related content visible (no "Aucun fichier joint" yet)
    expect(screen.queryByText(/aucun fichier joint/i)).not.toBeInTheDocument()
  })

  it('expands and shows file list on click', () => {
    render(<TaskFilesSection {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /implémenter login/i }))
    // FileList renders with empty files → shows "Aucun fichier joint"
    expect(screen.getByText(/aucun fichier joint/i)).toBeInTheDocument()
  })

  it('collapses again on second click', () => {
    render(<TaskFilesSection {...defaultProps} />)
    const btn = screen.getByRole('button', { name: /implémenter login/i })
    fireEvent.click(btn) // expand
    expect(screen.getByText(/aucun fichier joint/i)).toBeInTheDocument()
    fireEvent.click(btn) // collapse
    expect(screen.queryByText(/aucun fichier joint/i)).not.toBeInTheDocument()
  })
})
