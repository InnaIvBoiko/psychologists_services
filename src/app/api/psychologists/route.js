import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePsychologist } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

// GET /api/psychologists — full published list (filtering/sorting happen client-side).
export async function GET() {
  const list = await prisma.psychologist.findMany({
    where: { published: true },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(list.map(serializePsychologist))
}

// POST /api/psychologists — psychologist application, created UNPUBLISHED (hidden from the list).
export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }

  if (!body?.name || !String(body.name).trim()) {
    return NextResponse.json({ error: { message: 'name is required' } }, { status: 400 })
  }

  const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v))

  const created = await prisma.psychologist.create({
    data: {
      name: String(body.name).trim(),
      surname: body.surname ?? null,
      avatar: body.avatar || null,
      experience: num(body.experience),
      license: body.license ?? null,
      specialization: body.specialization ?? null,
      initial_consultation: body.initial_consultation ?? null,
      about: body.about ?? null,
      rating: num(body.rating) ?? 0,
      price_per_hour: num(body.price_per_hour),
      popular: Boolean(body.popular),
      reviews: Array.isArray(body.reviews) ? body.reviews : [],
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
      availability: body.availability ?? null,
      user_email: body.user_email ?? null,
      published: false,
    },
  })

  return NextResponse.json(serializePsychologist(created))
}
