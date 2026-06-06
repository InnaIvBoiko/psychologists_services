import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePsychologist } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

// GET /api/psychologists/:id — single psychologist (id is the numeric / documentId string).
export async function GET(_req, { params }) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json(null, { status: 400 })
  }
  const p = await prisma.psychologist.findUnique({ where: { id } })
  if (!p) {
    return NextResponse.json(null, { status: 404 })
  }
  return NextResponse.json(serializePsychologist(p))
}
