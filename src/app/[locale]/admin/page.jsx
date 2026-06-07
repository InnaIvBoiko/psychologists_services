import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getAllPsychologists } from '@/lib/queries'
import AdminDashboard from '@/views/AdminDashboard/AdminDashboard.jsx'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin — applications',
}

// Admin-only. Non-admins get a 404 so the route's existence isn't revealed; the
// admin API enforces 403 independently, so this page is just the UI shell.
export default async function Page() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) notFound()

  const psychologists = await getAllPsychologists()
  return <AdminDashboard initial={psychologists} />
}
