import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/psychologists/:id/reviews — append a review and recompute the average rating.
export async function POST(req, { params }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Login required to review' } }, { status: 401 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: { message: 'Invalid psychologist id' } }, { status: 400 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }

  const { reviewer, rating, comment } = body || {}
  if (!reviewer || !rating || !comment) {
    return NextResponse.json(
      { error: { message: 'reviewer, rating and comment are required.' } },
      { status: 400 }
    )
  }

  const psychologist = await prisma.psychologist.findUnique({ where: { id } })
  if (!psychologist) {
    return NextResponse.json({ error: { message: 'Psychologist not found.' } }, { status: 404 })
  }

  // Review integrity: only patients who actually booked this psychologist may review them.
  // Appointments are matched by the logged-in user's email (same key as /api/appointments/mine),
  // and store the psychologist id as a string.
  const hasAppointment = await prisma.appointment.findFirst({
    where: { email: session.user.email, psychologist_id: String(id) },
    select: { id: true },
  })
  if (!hasAppointment) {
    return NextResponse.json(
      { error: { message: 'You can only review a psychologist you have booked an appointment with.' } },
      { status: 403 }
    )
  }

  const reviews = Array.isArray(psychologist.reviews) ? psychologist.reviews : []
  const newReview = {
    reviewer: String(reviewer).trim(),
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: String(comment).trim(),
    date: new Date().toISOString().slice(0, 10),
  }

  const updatedReviews = [...reviews, newReview]
  const avgRating = updatedReviews.reduce((s, r) => s + r.rating, 0) / updatedReviews.length

  await prisma.psychologist.update({
    where: { id },
    data: { reviews: updatedReviews, rating: Math.round(avgRating * 10) / 10 },
  })

  return NextResponse.json({ success: true, review: newReview })
}
