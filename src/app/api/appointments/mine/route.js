import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/appointments/mine — all appointments for the logged-in user (upcoming/past split is done client-side).
export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json([])
  }

  const list = await prisma.appointment.findMany({
    where: { email: session.user.email },
    orderBy: { time_slot: 'asc' },
  })

  return NextResponse.json(list.map((a) => ({ ...a, documentId: String(a.id) })))
}
