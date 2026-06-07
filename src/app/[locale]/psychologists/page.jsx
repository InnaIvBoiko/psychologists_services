import { getPublishedPsychologists } from '@/lib/queries'
import PsychologistsPage from '@/views/PsychologistsPage/PsychologistsPage.jsx'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Psychologists — browse and book a session',
}

// Server Component: the list is fetched on the server and passed to the
// (client) page, so it is server-rendered for SEO and a fast first paint.
export default async function Page() {
  const psychologists = await getPublishedPsychologists()
  return <PsychologistsPage initialPsychologists={psychologists} />
}
