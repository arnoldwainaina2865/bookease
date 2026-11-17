
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
    confirmed: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    rejected: 'bg-gray-100 text-gray-600',
  }

  return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#E7E8E4] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#777D76]">{label}</p>
        <Icon size={19} className="text-[#647D68]" />
      </div>

      <p className="mt-5 text-2xl font-semibold text-[#202421]">
        {value}
      </p>
    </div>
  )
}

function ProviderDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getProviderDashboard()

      setDashboard(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load dashboard information. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <RefreshCw size={25} className="animate-spin text-[#647D68]" />
          <p className="mt-4 text-sm text-[#777D76]">
            Loading your dashboard...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-[#E7E8E4] bg-white p-8 text-center">
          <p className="font-medium text-[#202421]">
            Dashboard unavailable
          </p>

          <p className="mt-2 text-sm text-[#777D76]">
            {error}
          </p>

          <button
            onClick={fetchDashboard}
            className="mt-5 rounded-lg bg-[#647D68] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#526D57]"
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
  },
]


  return (
    <DashboardLayout>
      <div className="space-y-8">

        <header>
          <p className="text-sm text-[#777D76]">
            Provider workspace
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#202421]">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#777D76]">
            Welcome back, {dashboard?.provider?.business_name || 'Provider'}.
            Here's your business overview.
          </p>
        </header>

        {/* Statistics */}
<section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </section>

        {/* Recent bookings */}
        <section className="overflow-hidden rounded-xl border border-[#E7E8E4] bg-white">

          <div className="flex items-center justify-between border-b border-[#E7E8E4] px-6 py-5">
            <div>
              <h2 className="font-semibold text-[#202421]">
                Recent bookings
              </h2>

              <p className="mt-1 text-sm text-[#777D76]">
                Your latest customer bookings
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              title="Refresh dashboard"
              className="rounded-lg border border-[#E7E8E4] p-2 text-[#777D76] hover:bg-[#F7F7F5]"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarDays
                size={28}
                className="mx-auto text-[#999E98]"
              />

              <p className="mt-3 text-sm font-medium text-[#202421]">
                No recent bookings
              </p>

              <p className="mt-1 text-sm text-[#777D76]">
                Your bookings will appear here when customers make reservations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAFAF9] text-xs text-[#777D76]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Service</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Amount</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E7E8E4]">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#FAFAF9]">

                      <td className="whitespace-nowrap px-6 py-4 font-medium text-[#202421]">
                        {booking.customer?.full_name ||
                          booking.customer?.name ||
                          'Customer'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-[#777D76]">
                        {booking.service?.name ||
                          booking.service?.title ||
                          'Service'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-[#777D76]">
                        {formatDate(booking.start_at)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-[#202421]">
                        {formatCurrency(booking.total_price)}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  )
}

export default ProviderDashboard
