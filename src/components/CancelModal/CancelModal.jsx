import { useLocale, useTranslations } from 'next-intl'
import Modal from '../Modal/Modal.jsx'
import { dateLocale } from '@/i18n/format'
import styles from './CancelModal.module.css'

export default function CancelModal({ appointment, onClose, onConfirm, loading }) {
  const t = useTranslations('CancelModal')
  const locale = useLocale()
  const date = formatSlot(appointment.time_slot, locale)

  return (
    <Modal onClose={onClose} title={t('title')}>
      <div className={styles.content}>
        <p className={styles.question}>
          {t.rich('question', {
            name: appointment.psychologist_name,
            date,
            b: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p className={styles.note}>{t('note')}</p>
        <div className={styles.actions}>
          <button className="btn" onClick={onClose} disabled={loading}>
            {t('keep')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? t('cancelling') : t('confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function formatSlot(slot, locale) {
  if (!slot) return ''
  const [datePart] = slot.split(' ')
  const d = new Date(datePart)
  return d.toLocaleDateString(dateLocale(locale), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
