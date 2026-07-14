import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FOLDERS = ['products', 'orders'] as const

// Saves an uploaded image to public/uploads/<folder> and returns its URL.
// Local-disk storage — this app has no cloud storage (Supabase) configured yet.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const folderInput = formData.get('folder')
    const folder = ALLOWED_FOLDERS.includes(folderInput as (typeof ALLOWED_FOLDERS)[number])
      ? (folderInput as string)
      : 'products'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be smaller than 5MB' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadDir, { recursive: true })

    const filename = `${randomUUID()}${extname(file.name) || '.jpg'}`
    const bytes = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), bytes)

    return NextResponse.json({ data: { url: `/uploads/${folder}/${filename}` } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/upload]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
