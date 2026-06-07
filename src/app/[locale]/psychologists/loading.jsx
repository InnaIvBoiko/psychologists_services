import { PsychologistCardSkeletonList } from '@/components/PsychologistCard/PsychologistCardSkeleton.jsx'

// Shown automatically by Next.js while the server component fetches the list.
export default function Loading() {
  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 28 }}>
          Psychologists
        </h1>
        <PsychologistCardSkeletonList count={3} />
      </div>
    </div>
  )
}
