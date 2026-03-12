// Day name indexed by Date.getDay() (0 = Sunday)
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const DEFAULT_AVAILABILITY = {
  monday:    { enabled: true,  start: '09:00', end: '17:00' },
  tuesday:   { enabled: true,  start: '09:00', end: '17:00' },
  wednesday: { enabled: true,  start: '09:00', end: '17:00' },
  thursday:  { enabled: true,  start: '09:00', end: '17:00' },
  friday:    { enabled: true,  start: '09:00', end: '17:00' },
  saturday:  { enabled: false, start: '10:00', end: '14:00' },
  sunday:    { enabled: false, start: '10:00', end: '14:00' },
  slot_duration: 60,
}

export function parseAvailability(raw) {
  if (!raw) return DEFAULT_AVAILABILITY
  if (typeof raw === 'string') {
    try { return { ...DEFAULT_AVAILABILITY, ...JSON.parse(raw) } } catch { return DEFAULT_AVAILABILITY }
  }
  return { ...DEFAULT_AVAILABILITY, ...raw }
}

// Returns true if the given ISO date string falls on a working day
export function isWorkingDay(isoDate, availability) {
  const av = parseAvailability(availability)
  // Use noon to avoid DST edge cases
  const dayName = DAY_NAMES[new Date(isoDate + 'T12:00:00').getDay()]
  return av[dayName]?.enabled ?? false
}

// Returns array of "HH:MM" slot strings for the given ISO date and availability config
export function generateSlots(isoDate, availability) {
  if (!isoDate) return []
  const av = parseAvailability(availability)
  const dayName = DAY_NAMES[new Date(isoDate + 'T12:00:00').getDay()]
  const day = av[dayName]
  if (!day?.enabled) return []

  const duration = Number(av.slot_duration) || 60
  const slots = []

  const [startH, startM] = day.start.split(':').map(Number)
  const [endH, endM] = day.end.split(':').map(Number)

  let current = startH * 60 + startM
  const end = endH * 60 + endM

  while (current + duration <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += duration
  }

  return slots
}

// Generate time options for a select (06:00 – 22:00, step 30 min)
export function generateTimeOptions() {
  const opts = []
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
}
