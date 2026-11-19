
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Wallet,
  XCircle,
  RefreshCw,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import { getProviderDashboard } from '../../services/dashboardService'

function formatCurrency(amount) {
  return `KSh ${Number(amount || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(date) {
  if (!date) return 'Date unavailable'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable'
  }

  return parsedDate.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusStyle(status) {
  const styles = {
    confirmed: 'bg-info-soft text-info-text',
    pending: 'bg-warning-soft text-warning-text',
    completed: 'bg-success-soft text-success-text',
    cancelled: 'bg-danger-soft text-danger-text',
    rejected: 'bg-surface-muted text-muted',
  }

  return styles[status?.toLowerCase()] || 'bg-surface-muted text-muted'
}

function StatCard({
  label,
  value,
  icon: Icon,
  fullWidth = false,
}) {
  return (
    <div
      className={`
        min-w-0 rounded-card border border-border
        bg-surface p-3 sm:p-5
        ${fullWidth ? 'col-span-2 xl:col-span-1' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-relaxed text-muted sm:text-sm">
          {label}
        </p>

        <Icon
          size={19}
          strokeWidth={1.8}
          className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5"
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 break-words text-xl font-semibold tabular-nums text-foreground sm:mt-5 sm:text-2xl">
        {value}
      </p>
    </div>
  )
}

function ProviderDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    getProviderDashboard()
      .then((data) => {
        if (!active) return

        setDashboard(data)
        setError('')
      })
      .catch((err) => {
        if (!active) return

        setError(
          err.response?.data?.message ||
          'Unable to load dashboard information. Please try again.'
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  const handleRefresh = () => {
    setLoading(true)
    setError('')
    setRefreshKey((current) => current + 1)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <RefreshCw size={25} className="animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted">
            Loading your dashboard...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <p className="font-medium text-foreground">
            Dashboard unavailable
          </p>

          <p className="mt-2 text-sm text-muted">
            {error}
          </p>

          <button
            onClick={handleRefresh}
            className="mt-5 rounded-button bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const statistics = dashboard?.statistics || {}
  const bookings = dashboard?.recent_bookings || []


const stats = [
  {
    label: 'Total bookings',
    value: statistics.total_bookings ?? 0,
    icon: CalendarDays,
  },
  {
    label: 'Pending bookings',
    value: statistics.pending_bookings ?? 0,
    icon: Clock,
  },
  {
    label: 'Confirmed bookings',
    value: statistics.confirmed_bookings ?? 0,
    icon: CheckCircle2,
  },
  {
    label: 'Completed bookings',
    value: statistics.completed_bookings ?? 0,
    icon: CheckCircle2,
  },
  {
    label: 'Cancelled bookings',
    value: statistics.cancelled_bookings ?? 0,
    icon: XCircle,
  },
  {
    label: 'Rejected bookings',
    value: statistics.rejected_bookings ?? 0,
    icon: XCircle,
  },
  {
    label: 'Total earnings',
    value: formatCurrency(statistics.total_earnings),
    icon: Wallet,
    fullWidth: true,
  },
]


  return (
    <DashboardLayout>
      <div className="space-y-8">

        <header>
          <p className="text-sm text-muted">
            Provider workspace
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted">
            Welcome back, {dashboard?.provider?.business_name || 'Provider'}.
            Here's your business overview.
          </p>
        </header>

        {/* Statistics */}
<section className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              fullWidth={stat.fullWidth}
            />
          ))}
        </section>

        {/* Recent bookings */}
        <section className="overflow-hidden rounded-card border border-border bg-surface">

          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <h2 className="font-semibold text-foreground">
                Recent bookings
              </h2>

              <p className="mt-1 text-sm text-muted">
                Your latest customer bookings
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh dashboard"
              className="rounded-button border border-border p-2 text-muted hover:bg-surface-muted"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarDays
                size={28}
                className="mx-auto text-muted"
              />

              <p className="mt-3 text-sm font-medium text-foreground">
                No recent bookings
              </p>

              <p className="mt-1 text-sm text-muted">
                Your bookings will appear here when customers make reservations.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile booking cards */}
              <div className="space-y-3 p-3 md:hidden">
                {bookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="rounded-card border border-border bg-surface p-4"
                  >
                    <h3 className="break-words text-sm font-semibold text-foreground">
                      {booking.service?.name ||
                        booking.service?.title ||
                        'Service'}
                    </h3>

                    <p className="mt-2 text-sm text-muted">
                      {booking.customer?.full_name ||
                        booking.customer?.name ||
                        'Customer'}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <CalendarDays
                        size={15}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      {formatDate(booking.start_at)}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(booking.total_price)}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tablet and desktop booking table */}
              <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs text-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Service</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Amount</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-surface-muted">

                      <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">
                        {booking.customer?.full_name ||
                          booking.customer?.name ||
                          'Customer'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-muted">
                        {booking.service?.name ||
                          booking.service?.title ||
                          'Service'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-muted">
                        {formatDate(booking.start_at)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-foreground">
                        {formatCurrency(booking.total_price)}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </section>

      </div>
    </DashboardLayout>
  )
}

export default ProviderDashboard
