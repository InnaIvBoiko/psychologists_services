import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getAllPsychologists } from '@/lib/queries'

export const dynamic = 'force-dynamic'

// GET /api/admin/psychologists — every profile (published + pending) for moderation.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: { message: 'Admin access required' } }, { status: 403 })
  }
  return NextResponse.json(await getAllPsychologists())
}
