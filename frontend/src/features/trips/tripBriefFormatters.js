export function formatTime(value) {
  if (!value) return 'Not provided'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not provided'
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(parsed)
}

export function tripLabel(trip) { return trip?.label || trip?.name || `${trip?.origin || 'Unknown start'} to ${trip?.destination || 'Unknown destination'}` }
export function newKey() { return crypto.randomUUID() }
