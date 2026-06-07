import { PrismaClient } from '@prisma/client'
import { TEST_EMAIL_PREFIX } from './helpers.js'

/**
 * Safety net: the auth lifecycle test deletes its own account through the UI,
 * but if a test fails mid-flow it can leave a throwaway user behind. Sweep any
 * account that still carries the e2e email prefix so the database stays clean.
 */
export default async function globalTeardown() {
  const prisma = new PrismaClient()
  try {
    const { count } = await prisma.user.deleteMany({
      where: { email: { startsWith: TEST_EMAIL_PREFIX } },
    })
    if (count > 0) console.log(`[e2e teardown] removed ${count} leftover test user(s)`)
  } catch (err) {
    // Don't fail the run on cleanup issues (e.g. DB unreachable in CI).
    console.warn('[e2e teardown] skipped:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}
