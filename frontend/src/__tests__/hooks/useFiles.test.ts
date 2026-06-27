import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock the api module BEFORE importing hooks
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api'
import {
  useProjectFiles,
  useUploadProjectFile,
  useDeleteProjectFile,
  useTaskFiles,
} from '@/hooks/useFiles'

// Create a fresh QueryClient for each test to avoid cache bleed
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useFiles hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useProjectFiles — fetches GET /projects/:id/files and returns data', async () => {
    const mockFiles = [{ id: 'f1', originalName: 'doc.pdf' }]
    vi.mocked(api.get).mockResolvedValue({ data: { data: mockFiles } })

    const { result } = renderHook(() => useProjectFiles('proj-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/files')
    expect(result.current.data).toEqual(mockFiles)
  })

  it('useTaskFiles — does NOT fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => useTaskFiles('proj-1', 'task-1', { enabled: false }),
      { wrapper: createWrapper() }
    )

    // Wait a tick to ensure no async fetch happened
    await new Promise(r => setTimeout(r, 50))

    expect(api.get).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('useUploadProjectFile — calls POST /projects/:id/files and invalidates query', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const mockAttachment = { id: 'att-1', originalName: 'test.pdf' }
    vi.mocked(api.post).mockResolvedValue({ data: { data: mockAttachment } })
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })

    const { result } = renderHook(() => useUploadProjectFile('proj-1'), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockFile)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.post).toHaveBeenCalledOnce()
    const [url, body] = vi.mocked(api.post).mock.calls[0]
    expect(url).toBe('/projects/proj-1/files')
    expect(body).toBeInstanceOf(FormData)
  })

  it('useDeleteProjectFile — calls DELETE /projects/:id/files/:fileId', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} })
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })

    const { result } = renderHook(() => useDeleteProjectFile('proj-1'), {
      wrapper: createWrapper(),
    })

    result.current.mutate('file-123')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.delete).toHaveBeenCalledWith('/projects/proj-1/files/file-123')
  })
})
