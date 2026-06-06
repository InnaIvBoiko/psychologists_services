import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/reviews/dismiss — record that the user dismissed the review prompt for an appointment.
export async function POST(req) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Login required' } }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }

  const appointmentId = body?.appointmentId
  if (!appointmentId) {
    return NextResponse.json({ error: { message: 'appointmentId is required.' } }, { status: 400 })
  }

  const userId = Number(session.user.id)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: { message: 'User not found.' } }, { status: 404 })
  }

  let dismissed = Array.isArray(user.psy_dismissed_reviews) ? user.psy_dismissed_reviews : []
  const aid = String(appointmentId)
  if (!dismissed.includes(aid)) {
    dismissed = [...dismissed, aid]
    await prisma.user.update({
      where: { id: userId },
      data: { psy_dismissed_reviews: dismissed },
    })
  }

  return NextResponse.json({ dismissed })
}
