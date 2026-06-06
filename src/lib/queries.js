import { prisma } from './prisma.js'
import { serializePsychologist } from './serialize.js'

// Server-side data access shared by the API route and the SSR page,
// so the published-list logic lives in one place.
export async function getPublishedPsychologists() {
  const list = await prisma.psychologist.findMany({
    where: { published: true },
    orderBy: { id: 'asc' },
  })
  return list.map(serializePsychologist)
}
