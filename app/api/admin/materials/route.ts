import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const materials = await prisma.filamentMaterial.findMany({
      include: { _count: { select: { filaments: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: materials })
  } catch (error) {
    console.error('[GET /api/admin/materials]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, properties } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const material = await prisma.filamentMaterial.create({
      data: { name, description: description || null, properties: properties || null },
    })
    return NextResponse.json({ data: material }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/materials]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
