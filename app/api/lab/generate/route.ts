import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supported product types the AI Lab can generate
const SUPPORTED_TYPES = ['keychain', 'clicker', 'keycap', 'nameplate'] as const
type ProductType = (typeof SUPPORTED_TYPES)[number]

// Template STL download URLs (placeholder — replace with actual generation service)
const TEMPLATE_MODELS: Record<ProductType, string> = {
  keychain: 'https://www.thingiverse.com/thing:3001224/files',
  clicker: 'https://www.thingiverse.com/thing:3001224/files',
  keycap: 'https://www.thingiverse.com/thing:3001224/files',
  nameplate: 'https://www.thingiverse.com/thing:3001224/files',
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const productType = formData.get('productType') as ProductType
    const imageFile = formData.get('image') as File | null

    if (!productType || !SUPPORTED_TYPES.includes(productType)) {
      return NextResponse.json(
        { error: 'Invalid productType. Must be one of: ' + SUPPORTED_TYPES.join(', ') },
        { status: 400 }
      )
    }

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    // TODO: Integrate with real AI 3D generation service:
    // Option A: Meshy.ai  — https://docs.meshy.ai/api-image-to-3d
    // Option B: Tripo3D   — https://platform.tripo3d.ai/docs/api
    // Option C: CSM.ai    — https://3d.csm.ai/docs
    //
    // Example with Meshy.ai:
    // const response = await fetch('https://api.meshy.ai/v2/image-to-3d', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.MESHY_API_KEY}` },
    //   body: formData,
    // })
    // const result = await response.json()
    // return NextResponse.json({ data: { taskId: result.task_id, status: 'processing' } })

    // Placeholder response simulating a successful generation
    await new Promise((r) => setTimeout(r, 1500)) // simulate processing

    return NextResponse.json({
      data: {
        taskId: `lab-${Date.now()}`,
        status: 'completed',
        productType,
        previewUrl: `https://placehold.co/400x400?text=${encodeURIComponent(productType + ' 3D')}`,
        downloadUrl: TEMPLATE_MODELS[productType],
        format: 'STL',
        message:
          'AI 3D model generated successfully (demo mode — connect Meshy.ai or Tripo3D for real generation)',
      },
    })
  } catch (error) {
    console.error('[POST /api/lab/generate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
