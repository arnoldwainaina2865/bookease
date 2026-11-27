export const formatCurrency = (value) =>
  `KSh ${Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-KE')

export const formatPercent = (value) =>
  `${Number(value || 0).toLocaleString('en-KE', {
    maximumFractionDigits: 2,
  })}%`

export const formatDate = (value) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Nairobi',
  })

export const formatHour = (hour) =>
  hour == null
    ? 'No activity'
    : `${String(hour).padStart(2, '0')}:00`

export const panelClass =
  'rounded-2xl border border-border bg-surface p-5 shadow-sm  '
