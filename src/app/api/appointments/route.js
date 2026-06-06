import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// GET /api/appointments?psychologist_id=&date=  → array of booked "HH:MM" slots for that day.
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const psychologist_id = searchParams.get('psychologist_id')
  const date = searchParams.get('date')
  if (!psychologist_id || !date) {
    return NextResponse.json([])
  }

  const appts = await prisma.appointment.findMany({
    where: { psychologist_id, time_slot: { contains: date } },
    select: { time_slot: true },
  })

  const slots = appts.map((a) => (a.time_slot || '').split(' ')[1]).filter(Boolean)
  return NextResponse.json(slots)
}

// POST /api/appointments — create a booking. Guests are allowed (the UI offers
// "Send as a guest"); logged-in users can additionally track/cancel via /mine.
// Rate-limited per IP since this is a public endpoint.
export async function POST(req) {
  const { success } = await rateLimit('booking', getClientIp(req))
  if (!success) {
    return NextResponse.json(
      { error: { message: 'Too many booking attempts. Please try again later.' } },
      { status: 429 }
    )
  }

  let b
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }

  const required = ['patient_name', 'phone', 'email', 'time_slot', 'psychologist_id', 'psychologist_name']
  for (const field of required) {
    if (!b?.[field] || !String(b[field]).trim()) {
      return NextResponse.json({ error: { message: `${field} is required` } }, { status: 400 })
    }
  }

  const created = await prisma.appointment.create({
    data: {
      patient_name: String(b.patient_name).trim(),
      phone: String(b.phone).trim(),
      email: String(b.email).trim(),
      time_slot: String(b.time_slot),
      comment: b.comment ? String(b.comment).trim() : null,
      psychologist_id: String(b.psychologist_id),
      psychologist_name: String(b.psychologist_name),
    },
  })

  return NextResponse.json({ ...created, documentId: String(created.id) })
}
