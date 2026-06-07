'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updatePsychologistAdmin, deletePsychologistAdmin } from '@/lib/api'
import AvailabilityEditor from '../../components/AvailabilityEditor/AvailabilityEditor.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import styles from './AdminDashboard.module.css'

// Mirrors the apply form's options so the editor offers the same choices.
const SPECIALIZATIONS = [
  'Anxiety & Stress',
  'Depression & Mood',
  'Trauma & PTSD',
  'Relationships & Family',
  'Child & Adolescent',
  'Addiction & Recovery',
  'Grief & Loss',
  'LGBTQ+',
  'Career & Life Coaching',
  'Other',
]

// Whitelisted editable fields, sent on save (matches the PATCH endpoint).
const EDITABLE = [
  'name', 'surname', 'avatar', 'experience', 'license', 'specialization',
  'initial_consultation', 'about', 'price_per_hour', 'popular', 'isAvailable', 'availability',
]

function toForm(p) {
  return {
    name: p.name ?? '',
    surname: p.surname ?? '',
    avatar: p.avatar ?? '',
    experience: p.experience ?? '',
    license: p.license ?? '',
    specialization: p.specialization ?? '',
    initial_consultation: p.initial_consultation ?? '',
    about: p.about ?? '',
    price_per_hour: p.price_per_hour ?? '',
    popular: Boolean(p.popular),
    isAvailable: p.isAvailable !== false,
    availability: p.availability ?? null,
  }
}

export default function AdminDashboard({ initial }) {
  const t = useTranslations('Admin')
  const router = useRouter()
  const [list, setList] = useState(initial)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const pendingCount = list.filter((p) => !p.published).length

  const replace = (updated) =>
    setList((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))

  const startEdit = (p) => {
    setError('')
    setEditingId(p.id)
    setForm(toForm(p))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(null)
  }

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setChecked = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.checked }))

  const togglePublished = async (p) => {
    setError('')
    setBusyId(p.id)
    try {
      const updated = await updatePsychologistAdmin(p.id, { published: !p.published })
      replace(updated)
      // Invalidate the cached RSC payload so navigating away and back shows fresh data
      // (and the public /psychologists list reflects the change).
      router.refresh()
    } catch (err) {
      setError(err.message || t('errStatus'))
    } finally {
      setBusyId(null)
    }
  }

  const saveEdit = async (p) => {
    setError('')
    if (!String(form.name).trim()) {
      setError(t('errNameRequired'))
      return
    }
    setBusyId(p.id)
    try {
      const payload = {}
      for (const k of EDITABLE) payload[k] = form[k]
      const updated = await updatePsychologistAdmin(p.id, payload)
      replace(updated)
      router.refresh()
      cancelEdit()
    } catch (err) {
      setError(err.message || t('errSave'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    const p = deleteTarget
    setBusyId(p.id)
    try {
      await deletePsychologistAdmin(p.id)
      setList((prev) => prev.filter((x) => x.id !== p.id))
      router.refresh()
      if (editingId === p.id) cancelEdit()
    } catch (err) {
      setError(err.message || t('errDelete'))
    } finally {
      setBusyId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <section className={styles.wrap}>
      <div className="container">
        <header className={styles.head}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>
            {t('profileCount', { count: list.length })}
            {pendingCount > 0 && <> · <strong>{t('pendingReview', { count: pendingCount })}</strong></>}
          </p>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {list.length === 0 ? (
          <p className={styles.empty}>{t('empty')}</p>
        ) : (
          <ul className={styles.list}>
            {list.map((p) => {
              const busy = busyId === p.id
              const isEditing = editingId === p.id
              return (
                <li key={p.id} className={styles.card}>
                  <div className={styles.row}>
                    <div className={styles.avatar}>
                      {p.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar} alt="" />
                      ) : (
                        <span>{(p.name || '?')[0].toUpperCase()}</span>
                      )}
                    </div>

                    <div className={styles.info}>
                      <div className={styles.nameLine}>
                        <span className={styles.name}>{p.name}</span>
                        <span className={`${styles.badge} ${p.published ? styles.badgePub : styles.badgePend}`}>
                          {p.published ? t('published') : t('pending')}
                        </span>
                      </div>
                      <div className={styles.meta}>
                        {p.specialization || '—'}
                        {p.price_per_hour ? ` · $${p.price_per_hour}/h` : ''}
                      </div>
                      {p.user_email && <div className={styles.owner}>{p.user_email}</div>}
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={p.published ? 'btn btn-outline' : 'btn btn-primary'}
                        onClick={() => togglePublished(p)}
                        disabled={busy}
                      >
                        {p.published ? t('unpublish') : t('publish')}
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => (isEditing ? cancelEdit() : startEdit(p))}
                        disabled={busy}
                      >
                        {isEditing ? t('close') : t('edit')}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setDeleteTarget(p)}
                        disabled={busy}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>

                  {isEditing && form && (
                    <div className={styles.editor}>
                      <div className={styles.grid}>
                        <label className={styles.field}>
                          <span>{t('fName')}</span>
                          <input className="input-field" value={form.name} onChange={set('name')} />
                        </label>
                        <label className={styles.field}>
                          <span>{t('fSurname')}</span>
                          <input className="input-field" value={form.surname} onChange={set('surname')} />
                        </label>
                        <label className={styles.field}>
                          <span>{t('fSpecialization')}</span>
                          <select className="input-field" value={form.specialization} onChange={set('specialization')}>
                            <option value="">{t('fEmpty')}</option>
                            {SPECIALIZATIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>{t('fExperience')}</span>
                          <input className="input-field" type="number" min="0" value={form.experience} onChange={set('experience')} />
                        </label>
                        <label className={styles.field}>
                          <span>{t('fPrice')}</span>
                          <input className="input-field" type="number" min="0" value={form.price_per_hour} onChange={set('price_per_hour')} />
                        </label>
                        <label className={styles.field}>
                          <span>{t('fLicense')}</span>
                          <input className="input-field" value={form.license} onChange={set('license')} />
                        </label>
                        <label className={styles.field}>
                          <span>{t('fConsultation')}</span>
                          <input className="input-field" value={form.initial_consultation} onChange={set('initial_consultation')} />
                        </label>
                        <label className={styles.field}>
                          <span>{t('fPhoto')}</span>
                          <input className="input-field" type="url" value={form.avatar} onChange={set('avatar')} />
                        </label>
                      </div>

                      <label className={styles.field}>
                        <span>{t('fAbout')}</span>
                        <textarea className="input-field" rows={4} value={form.about} onChange={set('about')} />
                      </label>

                      <div className={styles.toggles}>
                        <label className={styles.checkbox}>
                          <input type="checkbox" checked={form.popular} onChange={setChecked('popular')} />
                          <span>{t('popular')}</span>
                        </label>
                        <label className={styles.checkbox}>
                          <input type="checkbox" checked={form.isAvailable} onChange={setChecked('isAvailable')} />
                          <span>{t('available')}</span>
                        </label>
                      </div>

                      <div className={styles.field}>
                        <span className={styles.availLabel}>{t('availability')}</span>
                        <AvailabilityEditor
                          key={p.id}
                          value={form.availability}
                          onChange={(av) => setForm((prev) => ({ ...prev, availability: av }))}
                        />
                      </div>

                      <div className={styles.editActions}>
                        <button className="btn btn-ghost" onClick={cancelEdit} disabled={busy}>
                          {t('cancel')}
                        </button>
                        <button className="btn btn-primary" onClick={() => saveEdit(p)} disabled={busy}>
                          {busy ? t('saving') : t('save')}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title={t('deleteTitle')}>
          <div className={styles.confirm}>
            <h3>{t('deleteHeading')}</h3>
            <p>
              {t.rich('deleteText', {
                name: deleteTarget.name,
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <div className={styles.editActions}>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                {t('deleteCancel')}
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                {t('deleteConfirm')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
