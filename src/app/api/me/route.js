import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/me — current user profile: favorites, dismissed reviews, and psychologist flag.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(null, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } })
  if (!user) {
    return NextResponse.json(null, { status: 404 })
  }

  const isPsychologist =
    (await prisma.psychologist.count({ where: { user_email: user.email } })) > 0

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    psy_favorites: Array.isArray(user.psy_favorites) ? user.psy_favorites : [],
    psy_dismissed_reviews: Array.isArray(user.psy_dismissed_reviews) ? user.psy_dismissed_reviews : [],
    isPsychologist,
  })
}

// DELETE /api/me — delete the account and all of the user's appointments (cascade).
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Login required' } }, { status: 401 })
  }

  const userId = Number(session.user.id)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: { message: 'User not found' } }, { status: 404 })
  }

  await prisma.appointment.deleteMany({ where: { email: user.email } })
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ message: 'Account deleted successfully' })
}
