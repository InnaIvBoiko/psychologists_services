import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { serializePsychologistAdmin } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v))

// PATCH /api/admin/psychologists/[id] — edit a profile and/or toggle its published status.
// Only whitelisted fields are writable; id / user_email / createdAt / reviews / rating are never touched.
export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: { message: 'Admin access required' } }, { status: 403 })
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: { message: 'Invalid id' } }, { status: 400 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }

  // Build the update only from fields the client actually sent, with type coercion.
  const data = {}
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k)

  if (has('name')) {
    const name = String(body.name).trim()
    if (!name) {
      return NextResponse.json({ error: { message: 'name cannot be empty' } }, { status: 400 })
    }
    data.name = name
  }
  if (has('surname')) data.surname = body.surname ?? null
  if (has('avatar')) data.avatar = body.avatar || null
  if (has('experience')) data.experience = num(body.experience)
  if (has('license')) data.license = body.license ?? null
  if (has('specialization')) data.specialization = body.specialization ?? null
  if (has('initial_consultation')) data.initial_consultation = body.initial_consultation ?? null
  if (has('about')) data.about = body.about ?? null
  if (has('price_per_hour')) data.price_per_hour = num(body.price_per_hour)
  if (has('popular')) data.popular = Boolean(body.popular)
  if (has('isAvailable')) data.isAvailable = Boolean(body.isAvailable)
  if (has('availability')) data.availability = body.availability ?? null
  if (has('published')) data.published = Boolean(body.published)

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: { message: 'No editable fields provided' } }, { status: 400 })
  }

  try {
    const updated = await prisma.psychologist.update({ where: { id }, data })
    return NextResponse.json(serializePsychologistAdmin(updated))
  } catch {
    return NextResponse.json({ error: { message: 'Psychologist not found' } }, { status: 404 })
  }
}

// DELETE /api/admin/psychologists/[id] — remove a profile entirely.
export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: { message: 'Admin access required' } }, { status: 403 })
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: { message: 'Invalid id' } }, { status: 400 })
  }

  try {
    await prisma.psychologist.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: { message: 'Psychologist not found' } }, { status: 404 })
  }
}
