import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: customers })
  } catch (error) {
    console.error('[GET /api/admin/customers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone } = body
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

    const customer = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: name || null, email, phone: phone || null, role: 'CUSTOMER' },
    })
    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/customers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
