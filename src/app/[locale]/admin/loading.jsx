import Skeleton from '@/components/Skeleton/Skeleton.jsx'

// Shown while the admin page fetches all psychologist profiles on the server.
export default function Loading() {
  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <Skeleton width={200} height={32} style={{ marginBottom: 12 }} />
        <Skeleton width={140} height={16} style={{ marginBottom: 28 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} width="100%" height={96} radius={16} />
          ))}
        </div>
      </div>
    </div>
  )
}
