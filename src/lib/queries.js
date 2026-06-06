import { prisma } from './prisma.js'
import { serializePsychologist, serializePsychologistAdmin } from './serialize.js'

// Server-side data access shared by the API route and the SSR page,
// so the published-list logic lives in one place.
export async function getPublishedPsychologists() {
  const list = await prisma.psychologist.findMany({
    where: { published: true },
    orderBy: { id: 'asc' },
  })
  return list.map(serializePsychologist)
}

// Admin moderation list: every profile, unpublished (pending) first so applications
// awaiting review surface at the top. Includes owner email + published status.
export async function getAllPsychologists() {
  const list = await prisma.psychologist.findMany({
    orderBy: [{ published: 'asc' }, { id: 'asc' }],
  })
  return list.map(serializePsychologistAdmin)
}
