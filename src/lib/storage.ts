import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

export const storage = {
  save(buffer: Buffer, originalName: string): string {
    if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
    const ext = extname(originalName)
    const filename = `${randomUUID()}${ext}`
    writeFileSync(join(UPLOADS_DIR, filename), buffer)
    return filename
  },

  delete(filename: string): void {
    const path = join(UPLOADS_DIR, filename)
    if (existsSync(path)) unlinkSync(path)
  },

  getPath(filename: string): string {
    return join(UPLOADS_DIR, filename)
  },
}
