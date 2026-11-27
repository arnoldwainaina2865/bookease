import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'


import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin, Scissors } from 'lucide-react'

import { getCurrentUser } from '../../services/authService'
import {
  getAvailableServices,
  getCustomerBookings,
  cancelCustomerBooking,
} from '../../services/customerApiService'

function CustomerDashboard() {
  const { confirm, dialogProps } = useConfirm()

  const user = getCurrentUser()

  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [totalBookings, setTotalBookings] = useState(null)
  const [totalServices, setTotalServices] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
const [cancellingBookingId, setCancellingBookingId] = useState(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [servicesData, bookingsData] = await Promise.all([
          getAvailableServices({ per_page: 6 }),
          getCustomerBookings({ per_page: 5 }),
        ])

        setServices(servicesData.services || [])
        setTotalServices(servicesData.pagination?.total_services ?? null)
        setBookings(bookingsData.bookings || [])
        setTotalBookings(bookingsData.pagination?.total_bookings ?? null)
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load your dashboard. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const handleCancelBooking = async (booking) => {
  const confirmed = await confirm({
    title: 'Cancel appointment?',
    message: `Are you sure you want to cancel your ${booking.service} appointment?`,
    confirmLabel: 'Cancel appointment',
    cancelLabel: 'Keep appointment',
    destructive: true,
  })

  if (!confirmed) return

  try {
    setCancellingBookingId(booking.id)
    setError('')
    setSuccessMessage('')

    const result = await cancelCustomerBooking(booking.id)

    setSuccessMessage(
      result.message || 'Booking cancelled successfully.'
    )

    const bookingsData = await getCustomerBookings({ per_page: 5 })
    setBookings(bookingsData.bookings || [])
        setTotalBookings(bookingsData.pagination?.total_bookings ?? null)
  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Unable to cancel this booking. Please try again.'
    )
  } finally {
    setCancellingBookingId(null)
  }
}

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-warning-soft text-warning-text',
      confirmed: 'bg-success-soft text-success-text',
      completed: 'bg-surface-muted text-muted',
      cancelled: 'bg-danger-soft text-danger-text',
      rejected: 'bg-danger-soft text-danger-text',
    }

    return styles[status?.toLowerCase()] || 'bg-surface-muted text-foreground'
  }


  return (
    <div className="bg-background text-foreground">


      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="mb-6 sm:mb-8">
          <p className="text-sm text-muted mb-2">
            CUSTOMER WORKSPACE
          </p>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}.
          </h1>

          <p className="mt-2 text-sm text-muted">
            Discover services and keep your appointments organised.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-button border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
            {error}
          </div>
        )}
        {successMessage && (
  <div className="mb-6 rounded-button border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text">
    {successMessage}
  </div>
)}

        <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-5">
          <div className="min-w-0 rounded-card border border-border bg-surface p-3 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted sm:text-sm">Your bookings</p>
              <CalendarDays size={18} className="shrink-0 text-primary" />
            </div>

            <p className="mt-3 text-2xl font-semibold text-foreground sm:mt-4 sm:text-3xl">
              {loading ? '—' : (totalBookings ?? '—')}
            </p>

            <p className="text-xs text-muted mt-1">
              All your appointments
            </p>
          </div>

          <div className="min-w-0 rounded-card border border-border bg-surface p-3 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted sm:text-sm">Available services</p>
              <Scissors size={18} className="shrink-0 text-primary" />
            </div>

            <p className="mt-3 text-2xl font-semibold text-foreground sm:mt-4 sm:text-3xl">
              {loading ? '—' : (totalServices ?? '—')}
            </p>

            <p className="text-xs text-muted mt-1">
              Across all providers
            </p>
          </div>
        </section>

        <section className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">Explore services</h2>
              <p className="text-sm text-muted mt-1">
                Find a service that suits your needs.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted py-8">
              Loading available services...
            </p>
          ) : services.length === 0 ? (
            <div className="bg-surface border border-border rounded-card p-8 text-center">
              <p className="text-sm text-muted">
                No services are currently available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex min-w-0 flex-col rounded-card border border-border bg-surface p-4 transition-shadow hover:shadow-card sm:p-6"
                >
                  <div className="w-10 h-10 rounded-button bg-primary-soft text-primary flex items-center justify-center mb-4">
                    <Scissors size={19} />
                  </div>

                  <h3 className="font-semibold text-lg">
                    {service.name}
                  </h3>

                  <p className="mb-5 mt-2 line-clamp-2 text-sm text-muted">
                    {service.description || 'Service details available on request.'}
                  </p>

                  <div className="mt-auto space-y-3 border-t border-border pt-4">
                    <p className="text-lg font-semibold text-primary">
                      KSh {Number(service.price).toLocaleString('en-KE')}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Clock3 size={14} />
                      {service.duration_minutes} minutes
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted">
                      <MapPin size={14} />
                      {service.provider?.location || 'Location not specified'}
                    </div>

                    <p className="text-xs text-foreground font-medium">
                      {service.provider?.business_name}
                    </p>

                    <Link
  to={`/customer/book?serviceId=${service.id}`}
  className="mt-5 flex w-full items-center justify-center rounded-button bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
>
  Book appointment
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent appointments</h2>
              <p className="mt-1 text-sm text-muted">
                Keep track of your latest bookings.
              </p>
            </div>

            <Link
              to="/customer/bookings"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all bookings
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-muted py-8">
              Loading appointments...
            </p>
          ) : bookings.length === 0 ? (
            <div className="bg-surface border border-border rounded-card p-8 text-center">
              <CalendarDays
                size={28}
                className="mx-auto text-muted mb-3"
              />

              <h3 className="font-medium">No appointments yet</h3>

              <p className="text-sm text-muted mt-2">
                Your bookings will appear here once you make a reservation.
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-card divide-y divide-border">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-medium">
                      {booking.service}
                    </h3>

                    <p className="text-sm text-muted mt-1">
                      {booking.provider}
                    </p>

                    <p className="text-xs text-muted mt-2">
                      {formatDate(booking.start_at)} at {formatTime(booking.start_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
  <span className="font-medium text-sm">
    KSh {Number(booking.total_price).toLocaleString('en-KE')}
  </span>

  <span
    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
  >
    {booking.status}
  </span>

  {['pending', 'confirmed'].includes(booking.status?.toLowerCase()) && (
    <button
      onClick={() => handleCancelBooking(booking)}
      disabled={cancellingBookingId === booking.id}
      className="px-3 py-1.5 rounded-button border border-danger/30 text-danger-text text-xs font-medium hover:bg-danger-soft disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {cancellingBookingId === booking.id
        ? 'Cancelling...'
        : 'Cancel booking'}
    </button>
  )}
</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default CustomerDashboard
