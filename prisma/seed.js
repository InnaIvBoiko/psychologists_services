import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const jsonPath = new URL('../src/data/psychologists.json', import.meta.url)
  const psychologists = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  const existing = await prisma.psychologist.count()
  if (existing > 0) {
    console.log(`Skipping seed: ${existing} psychologists already in the database.`)
    return
  }

  const data = psychologists.map((p) => ({
    name: p.name,
    avatar: p.avatar ?? null,
    experience: p.experience ?? null,
    license: p.license ?? null,
    specialization: p.specialization ?? null,
    initial_consultation: p.initial_consultation ?? null,
    about: p.about ?? null,
    rating: p.rating ?? 0,
    price_per_hour: p.price_per_hour ?? null,
    popular: Boolean(p.popular),
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
    isAvailable: true,
    published: true,
  }))

  const result = await prisma.psychologist.createMany({ data })
  console.log(`✅ Seeded ${result.count} psychologists.`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
