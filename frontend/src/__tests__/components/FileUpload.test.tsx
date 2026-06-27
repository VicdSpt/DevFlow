import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '@/components/FileUpload'

describe('FileUpload', () => {
  it('renders the attach button', () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={false} />)
    expect(screen.getByRole('button', { name: /joindre un fichier/i })).toBeInTheDocument()
  })

  it('calls onUpload with the selected file when file is under 10 MB', async () => {
    const onUpload = vi.fn()
    render(<FileUpload onUpload={onUpload} isUploading={false} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 5 })

    await userEvent.upload(input, file)

    expect(onUpload).toHaveBeenCalledOnce()
    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('shows error and does NOT call onUpload when file exceeds 10 MB', async () => {
    const onUpload = vi.fn()
    render(<FileUpload onUpload={onUpload} isUploading={false} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'big.zip', { type: 'application/zip' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })

    await userEvent.upload(input, file)

    expect(screen.getByText(/fichier trop lourd/i)).toBeInTheDocument()
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows "Envoi..." and disables the button when isUploading is true', () => {
    render(<FileUpload onUpload={vi.fn()} isUploading={true} />)
    const button = screen.getByRole('button', { name: /envoi/i })
    expect(button).toBeDisabled()
  })
})
