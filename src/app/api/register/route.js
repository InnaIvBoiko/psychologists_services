import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(req) {
  const { success } = await rateLimit('register', getClientIp(req))
  if (!success) {
    return NextResponse.json(
      { error: { message: 'Too many sign-up attempts. Please try again later.' } },
      { status: 429 }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }

  const username = String(body?.username || '').trim()
  const email = String(body?.email || '').toLowerCase().trim()
  const password = String(body?.password || '')

  if (!username || username.length < 3) {
    return NextResponse.json({ error: { message: 'Username must be at least 3 characters' } }, { status: 400 })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: { message: 'A valid email is required' } }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: { message: 'Password must be at least 8 characters' } }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: { message: 'Email already registered' } }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, email, passwordHash, psy_favorites: [], psy_dismissed_reviews: [] },
  })

  return NextResponse.json({
    user: { id: user.id, email: user.email, username: user.username },
  })
}
