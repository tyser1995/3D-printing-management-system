import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { getSettings } from '@/lib/settings'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FOLDERS = ['products', 'orders'] as const

async function saveLocally(folder: string, filename: string, bytes: Buffer): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), bytes)
  return `/uploads/${folder}/${filename}`
}

// Saves an uploaded image either to Supabase Storage or to public/uploads/<folder>,
// depending on the "storage" section of Settings. If Supabase is selected but not
// configured (or the upload fails), falls back to local disk so uploads never hard-fail.
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

    const filename = `${randomUUID()}${extname(file.name) || '.jpg'}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const settings = await getSettings()
    if (settings.storage?.provider === 'supabase') {
      const client = getSupabaseAdminClient()
      const bucket = settings.storage.supabaseBucket || 'uploads'
      if (client) {
        const path = `${folder}/${filename}`
        const { error } = await client.storage
          .from(bucket)
          .upload(path, bytes, { contentType: file.type, upsert: false })
        if (!error) {
          const {
            data: { publicUrl },
          } = client.storage.from(bucket).getPublicUrl(path)
          return NextResponse.json({ data: { url: publicUrl } }, { status: 201 })
        }
        console.error(
          '[POST /api/admin/upload] Supabase upload failed, falling back to local disk',
          error
        )
      }
    }

    const url = await saveLocally(folder, filename, bytes)
    return NextResponse.json({ data: { url } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/upload]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
