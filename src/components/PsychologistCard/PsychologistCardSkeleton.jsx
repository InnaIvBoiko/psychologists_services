import Skeleton from '../Skeleton/Skeleton.jsx'
import styles from './PsychologistCardSkeleton.module.css'

// Placeholder shaped like a PsychologistCard, shown while the list loads.
export default function PsychologistCardSkeleton() {
  return (
    <article className={styles.card} aria-hidden="true">
      <div className={styles.avatar}>
        <Skeleton width={120} height={120} radius={30} />
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width={90} height={12} />
            <Skeleton width={160} height={20} />
          </div>
          <Skeleton width={120} height={16} />
        </div>

        <div className={styles.tags}>
          <Skeleton width={130} height={28} radius={20} />
          <Skeleton width={90} height={28} radius={20} />
          <Skeleton width={170} height={28} radius={20} />
        </div>

        <Skeleton width="100%" height={12} />
        <Skeleton width="92%" height={12} />
        <Skeleton width="78%" height={12} />
      </div>
    </article>
  )
}

// Convenience: render a list of N skeleton cards with the page's list spacing.
export function PsychologistCardSkeletonList({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Array.from({ length: count }, (_, i) => (
        <PsychologistCardSkeleton key={i} />
      ))}
    </div>
  )
}
