import styles from './Skeleton.module.css'

// Reusable shimmer placeholder. Size it with width/height/radius props or
// override anything via `style`. Decorative, so it's hidden from screen readers.
export default function Skeleton({ width, height, radius, className = '', style }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}
