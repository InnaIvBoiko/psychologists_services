'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      setError(err.message || 'Failed to update status')
    } finally {
      setBusyId(null)
    }
  }

  const saveEdit = async (p) => {
    setError('')
    if (!String(form.name).trim()) {
      setError('Name is required')
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
      setError(err.message || 'Failed to save changes')
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
      setError(err.message || 'Failed to delete')
    } finally {
      setBusyId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <section className={styles.wrap}>
      <div className="container">
        <header className={styles.head}>
          <h1 className={styles.title}>Applications</h1>
          <p className={styles.subtitle}>
            {list.length} profile{list.length === 1 ? '' : 's'}
            {pendingCount > 0 && <> · <strong>{pendingCount} pending review</strong></>}
          </p>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {list.length === 0 ? (
          <p className={styles.empty}>No psychologist profiles yet.</p>
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
                          {p.published ? 'Published' : 'Pending'}
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
                        {p.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => (isEditing ? cancelEdit() : startEdit(p))}
                        disabled={busy}
                      >
                        {isEditing ? 'Close' : 'Edit'}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setDeleteTarget(p)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isEditing && form && (
                    <div className={styles.editor}>
                      <div className={styles.grid}>
                        <label className={styles.field}>
                          <span>Name</span>
                          <input className="input-field" value={form.name} onChange={set('name')} />
                        </label>
                        <label className={styles.field}>
                          <span>Surname</span>
                          <input className="input-field" value={form.surname} onChange={set('surname')} />
                        </label>
                        <label className={styles.field}>
                          <span>Specialization</span>
                          <select className="input-field" value={form.specialization} onChange={set('specialization')}>
                            <option value="">—</option>
                            {SPECIALIZATIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Experience (years)</span>
                          <input className="input-field" type="number" min="0" value={form.experience} onChange={set('experience')} />
                        </label>
                        <label className={styles.field}>
                          <span>Price per hour ($)</span>
                          <input className="input-field" type="number" min="0" value={form.price_per_hour} onChange={set('price_per_hour')} />
                        </label>
                        <label className={styles.field}>
                          <span>License</span>
                          <input className="input-field" value={form.license} onChange={set('license')} />
                        </label>
                        <label className={styles.field}>
                          <span>Initial consultation</span>
                          <input className="input-field" value={form.initial_consultation} onChange={set('initial_consultation')} />
                        </label>
                        <label className={styles.field}>
                          <span>Photo URL</span>
                          <input className="input-field" type="url" value={form.avatar} onChange={set('avatar')} />
                        </label>
                      </div>

                      <label className={styles.field}>
                        <span>About</span>
                        <textarea className="input-field" rows={4} value={form.about} onChange={set('about')} />
                      </label>

                      <div className={styles.toggles}>
                        <label className={styles.checkbox}>
                          <input type="checkbox" checked={form.popular} onChange={setChecked('popular')} />
                          <span>Popular</span>
                        </label>
                        <label className={styles.checkbox}>
                          <input type="checkbox" checked={form.isAvailable} onChange={setChecked('isAvailable')} />
                          <span>Available for booking</span>
                        </label>
                      </div>

                      <div className={styles.field}>
                        <span className={styles.availLabel}>Availability</span>
                        <AvailabilityEditor
                          key={p.id}
                          value={form.availability}
                          onChange={(av) => setForm((prev) => ({ ...prev, availability: av }))}
                        />
                      </div>

                      <div className={styles.editActions}>
                        <button className="btn btn-ghost" onClick={cancelEdit} disabled={busy}>
                          Cancel
                        </button>
                        <button className="btn btn-primary" onClick={() => saveEdit(p)} disabled={busy}>
                          {busy ? 'Saving…' : 'Save changes'}
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
        <Modal onClose={() => setDeleteTarget(null)} title="Delete profile">
          <div className={styles.confirm}>
            <h3>Delete this profile?</h3>
            <p>
              <strong>{deleteTarget.name}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div className={styles.editActions}>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
