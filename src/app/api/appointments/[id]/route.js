import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// DELETE /api/appointments/:id — cancel one of the logged-in user's own appointments.
export async function DELETE(_req, { params }) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: { message: 'Login required' } }, { status: 401 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: { message: 'Invalid id' } }, { status: 400 })
  }

  const appt = await prisma.appointment.findUnique({ where: { id } })
  if (!appt) {
    return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 })
  }
  if (appt.email !== session.user.email) {
    return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 })
  }

  await prisma.appointment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
