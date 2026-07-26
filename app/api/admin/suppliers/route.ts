import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { filaments: true, purchases: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: suppliers })
  } catch (error) {
    console.error('[GET /api/admin/suppliers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, contact, email, phone, address } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contact: contact || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    })
    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/suppliers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
