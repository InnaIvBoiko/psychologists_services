import Modal from '../Modal/Modal.jsx'
import styles from './CancelModal.module.css'

export default function CancelModal({ appointment, onClose, onConfirm, loading }) {
  const { date } = formatSlot(appointment.time_slot)

  return (
    <Modal onClose={onClose} title="Cancel appointment">
      <div className={styles.content}>
        <p className={styles.question}>
          Are you sure you want to cancel your appointment with{' '}
          <strong>{appointment.psychologist_name}</strong> on{' '}
          <strong>{date}</strong>?
        </p>
        <p className={styles.note}>This action cannot be undone.</p>
        <div className={styles.actions}>
          <button className="btn" onClick={onClose} disabled={loading}>
            Keep appointment
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function formatSlot(slot) {
  if (!slot) return { date: '' }
  const [datePart] = slot.split(' ')
  const d = new Date(datePart)
  return { date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
}
