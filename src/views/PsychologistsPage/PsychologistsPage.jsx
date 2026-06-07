'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import PsychologistCard from '../../components/PsychologistCard/PsychologistCard.jsx'
import { getPsychologists } from '@/lib/api'
import { useDebounce } from '../../hooks/useDebounce.js'
import styles from './PsychologistsPage.module.css'

// `labelKey` resolves against the "Psychologists" message namespace at render time.
const FILTERS = [
  { labelKey: 'filterShowAll', value: 'all' },
  { labelKey: 'filterAZ', value: 'az' },
  { labelKey: 'filterZA', value: 'za' },
  { labelKey: 'filterLt100', value: 'lt100' },
  { labelKey: 'filterGt100', value: 'gt100' },
  { labelKey: 'filterPopular', value: 'popular' },
  { labelKey: 'filterNotPopular', value: 'not-popular' },
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

export default function PsychologistsPage({ initialPsychologists = [] }) {
  const t = useTranslations('Psychologists')
  const [data, setData] = useState(initialPsychologists)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [dropOpen, setDropOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [toast, setToast] = useState(null)

  // The list is server-rendered (passed as initialPsychologists); we only
  // refetch on the client after a review is submitted, to refresh ratings.
  useEffect(() => {
    async function refetch() {
      const psychologists = await getPsychologists()
      setData(psychologists)
    }
    window.addEventListener('psy:review-submitted', refetch)
    return () => window.removeEventListener('psy:review-submitted', refetch)
  }, [])

  const searched = debouncedSearch.trim()
    ? data.filter((p) => {
        const q = debouncedSearch.toLowerCase()
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
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filter, debouncedSearch])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const currentKey = FILTERS.find((f) => f.value === filter)?.labelKey
  const currentLabel = currentKey ? t(currentKey) : t('filterLabel')

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.toolbar}>
          <h1 className={styles.pageTitle}>{t('title')}</h1>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">🔍</span>
            <input
              className={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className={styles.searchClear}
                onClick={() => setSearch('')}
                aria-label={t('clearSearch')}
              >✕</button>
            )}
          </div>
          <div className={styles.dropdown}>
            <button
              className={styles.dropTrigger}
              onClick={() => setDropOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropOpen}
              aria-label={t('filterLabel')}
            >
              {currentLabel}
              <span className={`${styles.dropArrow} ${dropOpen ? styles.open : ''}`} aria-hidden="true">▾</span>
            </button>
            {dropOpen && (
              <ul className={styles.dropMenu} role="listbox" aria-label={t('filterLabel')}>
                {FILTERS.map((f) => (
                  <li
                    key={f.value}
                    role="option"
                    aria-selected={filter === f.value}
                    className={`${styles.dropItem} ${filter === f.value ? styles.dropItemActive : ''}`}
                    onClick={() => { setFilter(f.value); setDropOpen(false) }}
                  >
                    {t(f.labelKey)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>{t('empty')}</p>
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
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>

      <div className={`toast ${toast ? 'visible' : ''}`}>{toast}</div>
    </div>
  )
}
