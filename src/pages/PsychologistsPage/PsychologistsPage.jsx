import { useState, useEffect } from 'react'
import PsychologistCard from '../../components/PsychologistCard/PsychologistCard.jsx'
import { getPsychologists } from '../../strapi/strapi.js'
import styles from './PsychologistsPage.module.css'

const FILTERS = [
  { label: 'Show all', value: 'all' },
  { label: 'A to Z', value: 'az' },
  { label: 'Z to A', value: 'za' },
  { label: 'Less than 100$', value: 'lt100' },
  { label: 'Greater than 100$', value: 'gt100' },
  { label: 'Popular', value: 'popular' },
  { label: 'Not popular', value: 'not-popular' },
]

const PAGE_SIZE = 3

function applyFilter(list, filter) {
  switch (filter) {
    case 'az': return [...list].sort((a, b) => a.name.localeCompare(b.name))
    case 'za': return [...list].sort((a, b) => b.name.localeCompare(a.name))
    case 'lt100': return list.filter((p) => (p.price_per_hour || p.pricePerHour || 0) < 100)
    case 'gt100': return list.filter((p) => (p.price_per_hour || p.pricePerHour || 0) > 100)
    case 'popular': return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'not-popular': return [...list].sort((a, b) => (a.rating || 0) - (b.rating || 0))
    default: return list
  }
}

export default function PsychologistsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const psychologists = await getPsychologists()
      setData(psychologists)
      setLoading(false)
    }
    fetchData()
  }, [])

  const searched = search.trim()
    ? data.filter((p) => {
        const q = search.toLowerCase()
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.surname || '').toLowerCase().includes(q) ||
          (p.specialization || '').toLowerCase().includes(q)
        )
      })
    : data

  const filtered = applyFilter(searched, filter)
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // Reset pagination on filter or search change
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filter, search])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const currentLabel = FILTERS.find((f) => f.value === filter)?.label ?? 'Filter'

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.toolbar}>
          <h1 className={styles.pageTitle}>Psychologists</h1>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search by name or specialization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <div className={styles.dropdown}>
            <button
              className={styles.dropTrigger}
              onClick={() => setDropOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropOpen}
            >
              {currentLabel}
              <span className={`${styles.dropArrow} ${dropOpen ? styles.open : ''}`}>▾</span>
            </button>
            {dropOpen && (
              <ul className={styles.dropMenu} role="listbox">
                {FILTERS.map((f) => (
                  <li
                    key={f.value}
                    role="option"
                    aria-selected={filter === f.value}
                    className={`${styles.dropItem} ${filter === f.value ? styles.dropItemActive : ''}`}
                    onClick={() => { setFilter(f.value); setDropOpen(false) }}
                  >
                    {f.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {loading ? (
          <p className={styles.empty}>Loading psychologists from Strapi...</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No psychologists match this filter.</p>
        ) : (
          <div className={styles.list}>
            {visible.map((p) => (
              <PsychologistCard key={p.id} psychologist={p} onToast={showToast} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className={styles.loadMoreWrap}>
            <button
              className="btn btn-primary"
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            >
              Load more
            </button>
          </div>
        )}
      </div>

      <div className={`toast ${toast ? 'visible' : ''}`}>{toast}</div>
    </div>
  )
}
