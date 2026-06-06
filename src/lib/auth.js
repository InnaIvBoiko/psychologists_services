import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma.js'

// Auth.js v5 — email/password via Credentials, JWT session strategy (no adapter tables needed).
// Sessions are stored in a secure cookie, so the login persists across page reloads.
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email || '').toLowerCase().trim()
        const password = String(credentials?.password || '')
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        // Returned object is embedded in the JWT (see jwt callback).
        return { id: String(user.id), email: user.email, name: user.username }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.username = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid
        session.user.username = token.username
      }
      return session
    },
  },
})
