import { useEffect, useState } from 'react'

import {
  Wallet,
  CalendarDays,
  CircleCheck,
  Users,
  Banknote,
  CalendarX,
  RefreshCw,
  TriangleAlert,
  ChartNoAxesCombined,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'

import { getProviderAnalytics } from '../../services/analyticsService'

import MetricCard from '../../components/analytics/MetricCard'
import TrendChart from '../../components/analytics/TrendChart'
import BookingDistribution from '../../components/analytics/BookingDistribution'
import AppointmentHeatmap from '../../components/analytics/AppointmentHeatmap'
import ReportActions from '../../components/analytics/ReportActions'

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  panelClass,
} from '../../components/analytics/formatters'

const PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

const inputClass =
  'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-600   '

export default function Analytics() {
  const [period, setPeriod] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [filters, setFilters] = useState({
    period: '30',
  })

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadAnalytics() {
      setLoading(true)
      setError('')
      setData(null)

      try {
        const result = await getProviderAnalytics(
          filters,
          controller.signal
        )

        if (!controller.signal.aborted) {
          setData({
            ...result.analytics,
            provider: result.provider,
          })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.message ||
              'Unable to load analytics. Please try again.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()

    return () => controller.abort()
  }, [filters, refreshKey])

  function changePeriod(value) {
    setPeriod(value)
    setFilterError('')

    if (value !== 'custom') {
      setFilters({ period: value })
    }
  }

  function applyCustomRange(event) {
    event.preventDefault()
    setFilterError('')

    if (!startDate || !endDate) {
      setFilterError('Select both a start and an end date.')
      return
    }

    if (startDate > endDate) {
      setFilterError('Start date must not be after end date.')
      return
    }

    const days =
      (Date.parse(endDate) - Date.parse(startDate)) /
        86400000 + 1

    if (days > 366) {
      setFilterError('Select a period of 366 days or fewer.')
      return
    }

    setFilters({
      period: 'custom',
      start_date: startDate,
      end_date: endDate,
    })
  }

  const overview = data?.overview
  const comparison = data?.comparison

  const metrics = overview
    ? [
        {
          label: 'Completed booking value',
          value: formatCurrency(overview.completed_booking_value),
          change: comparison.completed_booking_value,
          icon: Wallet,
        },
        {
          label: 'Total appointments',
          value: formatNumber(overview.total_bookings),
          change: comparison.total_bookings,
          icon: CalendarDays,
        },
        {
          label: 'Completion rate',
          value: formatPercent(overview.completion_rate),
          change: comparison.completion_rate_change,
          percentagePoints: true,
          icon: CircleCheck,
        },
        {
          label: 'Unique customers',
          value: formatNumber(overview.unique_customers),
          change: comparison.unique_customers,
          icon: Users,
        },
        {
          label: 'Average booking value',
          value: formatCurrency(overview.average_booking_value),
          change: comparison.average_booking_value,
          icon: Banknote,
        },
        {
          label: 'Cancellation rate',
          value: formatPercent(overview.cancellation_rate),
          change: comparison.cancellation_rate_change,
          percentagePoints: true,
          inverse: true,
          icon: CalendarX,
        },
      ]
    : []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Business intelligence
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground ">
              Analytics & Reports
            </h1>

            <p className="mt-2 text-sm text-muted ">
              Understand your business performance and appointment activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(event) => changePeriod(event.target.value)}
              className={inputClass}
              aria-label="Reporting period"
            >
              {PERIODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={loading}
              onClick={() => setRefreshKey((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50   "
            >
              <RefreshCw
                size={15}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </header>

        {period === 'custom' && (
          <form
            onSubmit={applyCustomRange}
            className={`${panelClass} flex flex-wrap items-end gap-4`}
          >
            <label className="flex flex-col gap-2 text-sm text-muted ">
              Start date
              <input
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-muted ">
              End date
              <input
                type="date"
                required
                min={startDate || undefined}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
            >
              Apply dates
            </button>

            {filterError && (
              <p role="alert" className="w-full text-sm text-rose-600">
                {filterError}
              </p>
            )}
          </form>
        )}

        <ReportActions
          key={data
            ? `${data.period.start_date}-${data.period.end_date}`
            : 'unavailable'}
          data={data}
          disabled={loading || Boolean(error)}
        />

        {loading && (
          <div aria-busy="true" aria-label="Loading analytics" className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className={`${panelClass} h-36 animate-pulse`}
                >
                  <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-5 h-7 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>

            <div className={`${panelClass} h-80 animate-pulse`} />
          </div>
        )}

        {error && (
          <div role="alert" className={`${panelClass} flex items-start gap-3`}>
            <TriangleAlert className="text-rose-500" size={21} />

            <div>
              <p className="font-semibold text-foreground ">
                Unable to load analytics
              </p>

              <p className="mt-1 text-sm text-muted">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted ">
              <span>
                Reporting period: {data.period.start_date} to {data.period.end_date}
              </span>

              <span>East Africa Time · {data.period.days} days</span>
            </div>

            {overview.total_bookings === 0 && (
              <div className={`${panelClass} flex items-center gap-4`}>
                <ChartNoAxesCombined
                  size={28}
                  className="text-emerald-600"
                />

                <div>
                  <p className="font-semibold text-foreground ">
                    No appointments in this period
                  </p>

                  <p className="mt-1 text-sm text-muted ">
                    Select a different date range to explore your business activity.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <TrendChart trends={data.trends} />

              <BookingDistribution
                distribution={data.booking_distribution}
              />
            </div>

            <TrendChart
              trends={data.trends}
              mode="bookings"
            />

            <section className={panelClass}>
              <h2 className="font-semibold text-foreground ">
                Service performance
              </h2>

              <p className="mt-1 text-sm text-muted ">
                Services ranked by completed booking value
              </p>

              {data.services.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  No service activity in this period.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted  ">
                      <tr>
                        {[
                          'Service',
                          'Appointments',
                          'Completed',
                          'Completion rate',
                          'Booking value',
                        ].map((label, index) => (
                          <th
                            key={label}
                            className={`px-3 py-3 font-medium ${index > 0 ? 'text-right' : ''}`}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.services.map((service) => (
                        <tr
                          key={service.service_id}
                          className="text-foreground "
                        >
                          <td className="px-3 py-4 font-medium">
                            {service.name}
                          </td>

                          <td className="px-3 py-4 text-right">
                            {service.bookings}
                          </td>

                          <td className="px-3 py-4 text-right">
                            {service.completed}
                          </td>

                          <td className="px-3 py-4 text-right">
                            {formatPercent(service.completion_rate)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(service.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={panelClass}>
              <h2 className="font-semibold text-foreground ">
                Customer insights
              </h2>

              <p className="mt-1 text-sm text-muted ">
                Customer activity and repeat business
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Unique customers', data.customers.unique_customers],
                  ['New customers', data.customers.new_customers],
                  ['Returning customers', data.customers.returning_customers],
                  [
                    'Returning customer rate',
                    formatPercent(data.customers.returning_customer_rate),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-surface-muted p-4 "
                  >
                    <p className="text-xs text-muted ">
                      {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-foreground ">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted ">
                New and returning customers are classified using completed appointments.
                Returning customers have completed appointments both before and during
                the selected reporting period.
              </p>
            </section>

            <AppointmentHeatmap operations={data.operations} />

            <p className="text-xs leading-relaxed text-muted ">
              Financial figures represent completed appointment values,
              not verified payments or business profit. Reports are based
              on appointment start dates and current booking statuses.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
