import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/psychologists/:id/toggle-favorite — add/remove from the logged-in user's favorites.
export async function POST(_req, { params }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Login required' } }, { status: 401 })
  }

  const userId = Number(session.user.id)
  const favId = String(params.id)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: { message: 'User not found' } }, { status: 404 })
  }

  const favorites = Array.isArray(user.psy_favorites) ? user.psy_favorites : []
  const isFav = favorites.includes(favId)
  const updated = isFav ? favorites.filter((f) => f !== favId) : [...favorites, favId]

  await prisma.user.update({
    where: { id: userId },
    data: { psy_favorites: updated },
  })

  return NextResponse.json({
    isFavorite: !isFav,
    favorites: updated,
    message: isFav ? 'Removed from favorites' : 'Added to favorites',
  })
}
