import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'


import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'

import {
  getCustomerBookings,
  cancelCustomerBooking,
} from '../../services/customerApiService'
// Format appointment dates.
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format appointment times.
const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}


const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000

// Check whether the booking has a cancellable status.
const hasCancellableStatus = (booking) => {
  return ['pending', 'confirmed'].includes(
    booking.status?.toLowerCase()
  )
}

// Check whether the customer can cancel the appointment.
const canCancelBooking = (booking, currentTime = Date.now()) => {
  if (!hasCancellableStatus(booking)) {
    return false
  }

  if (!booking.start_at) {
    return false
  }

  const appointmentStart = new Date(booking.start_at).getTime()

  if (!Number.isFinite(appointmentStart)) {
    return false
  }

  const timeRemaining = appointmentStart - currentTime

  return timeRemaining > CANCELLATION_WINDOW_MS
}

// Format appointment prices in Kenyan shillings.
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 2,
  }).format(Number(price) || 0)
}

// Return styling based on booking status.
const getStatusStyle = (status) => {
  const styles = {
    pending: 'bg-warning-soft text-warning-text border-warning/30',
    confirmed: 'bg-success-soft text-success-text border-success/30',
    completed: 'bg-surface-muted text-foreground border-border',
    cancelled: 'bg-danger-soft text-danger-text border-danger/30',
    rejected: 'bg-danger-soft text-danger-text border-danger/30',
  }

  return styles[status?.toLowerCase()] ||
    'bg-surface-muted text-muted border-border'
}
const STATUS_TABS = [
  { label: 'All bookings', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

function CustomerBookings() {
  const { confirm, dialogProps } = useConfirm()

  const [bookings, setBookings] = useState([])
  const [activeStatus, setActiveStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_bookings: 0,
    has_next: false,
    has_previous: false,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [cancellingBookingId, setCancellingBookingId] = useState(null)
  const [currentTime, setCurrentTime] = useState(Date.now)

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(Date.now())
  }, 1000)

  return () => clearInterval(timer)
}, [])

  // Fetch bookings whenever the selected status or page changes.
useEffect(() => {
  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await getCustomerBookings({
        page,
        per_page: 10,
        status: activeStatus,
      })

      setBookings(response.bookings || [])
      setPagination(response.pagination || {})
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load your bookings. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  fetchBookings()
}, [page, activeStatus])

// Change the selected status and return to the first page.
const handleStatusChange = (status) => {
  setActiveStatus(status)
  setPage(1)
  setSuccessMessage('')
}

// Cancel a pending or confirmed appointment.
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

    const response = await cancelCustomerBooking(booking.id)

    setSuccessMessage(
      response.message || 'Your appointment has been cancelled successfully.'
    )

    // Refresh the current booking list.
    const updatedResponse = await getCustomerBookings({
      page,
      per_page: 10,
      status: activeStatus,
    })

    setBookings(updatedResponse.bookings || [])
    setPagination(updatedResponse.pagination || {})
  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Unable to cancel this appointment. Please try again.'
    )
  } finally {
    setCancellingBookingId(null)
  }
}


// Filter the currently loaded bookings by service or provider.
const filteredBookings = bookings.filter((booking) => {
  const search = searchTerm.trim().toLowerCase()

  if (!search) return true

  return (
    booking.service?.toLowerCase().includes(search) ||
    booking.provider?.toLowerCase().includes(search)
  )
})

  return (
  <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <Link
            to="/customer/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Customer workspace
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                My bookings
              </h1>

              <p className="mt-2 text-sm text-muted">
                View and manage all your appointments in one place.
              </p>
            </div>

            <Link
              to="/customer/book"
              className="inline-flex items-center justify-center rounded-card bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
            >
              Book a service
            </Link>
          </div>
        </div>
{/* Booking filters */}
<div className="mb-6 rounded-card border border-border bg-surface p-5 shadow-sm">

  {/* Search */}
  <div className="relative mb-6">
    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
    />

    <input
      type="text"
      placeholder="Search by service or provider..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full rounded-card border border-border bg-surface-muted py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
    />
  </div>

  {/* Status tabs */}
  <div className="flex flex-wrap gap-2">
    {STATUS_TABS.map((tab) => (
      <button
        key={tab.value || 'all'}
        onClick={() => handleStatusChange(tab.value)}
        className={`rounded-card px-4 py-2 text-sm font-medium transition ${
          activeStatus === tab.value
            ? 'bg-primary text-primary-foreground'
            : 'bg-surface-muted text-muted hover:bg-primary-soft'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>

</div>

{/* Feedback messages */}
{error && (
  <div className="mb-5 rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
    {error}
  </div>
)}

{successMessage && (
  <div className="mb-5 rounded-card border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text">
    {successMessage}
  </div>
)}
{/* Booking cards */}
<div className="space-y-4">

  {loading ? (
    <div className="rounded-card border border-border bg-surface p-12 text-center">
      <p className="text-sm text-muted">
        Loading your bookings...
      </p>
    </div>
  ) : filteredBookings.length === 0 ? (
    <div className="rounded-card border border-border bg-surface p-12 text-center">
      <CalendarDays
        size={36}
        className="mx-auto mb-4 text-muted"
      />

      <h3 className="text-lg font-semibold text-foreground">
        No bookings found
      </h3>

      <p className="mt-2 text-sm text-muted">
        {searchTerm
          ? 'Try a different search term.'
          : 'You have no bookings in this category yet.'}
      </p>

      {!searchTerm && (
        <Link
          to="/customer/book"
          className="mt-5 inline-flex rounded-card bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Book a service
        </Link>
      )}
    </div>
  ) : (
    filteredBookings.map((booking) => (
      <div
        key={booking.id}
        className="rounded-card border border-border bg-surface p-5 shadow-sm transition hover:shadow-md sm:p-6"
      >
        {/* Service and status */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {booking.service}
            </h3>

            <p className="mt-1 text-sm text-muted">
              Provided by {booking.provider}
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(booking.status)}`}
          >
            {booking.status}
          </span>
        </div>

        {/* Appointment details */}
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">

          <div className="flex items-center gap-3">
            <CalendarDays
              size={19}
              className="text-primary"
            />

            <div>
              <p className="text-xs text-muted">
                Appointment date
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(booking.start_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock3
              size={19}
              className="text-primary"
            />

            <div>
              <p className="text-xs text-muted">
                Appointment time
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatTime(booking.start_at)}
              </p>
            </div>
          </div>

        </div>

        {/* Price and cancellation */}
        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">

          <div>
            <p className="text-xs text-muted">
              Total price
            </p>
            <p className="text-lg font-semibold text-primary">
              {formatPrice(booking.total_price)}
            </p>
          </div>


{canCancelBooking(booking, currentTime) ? (
  <button
    onClick={() => handleCancelBooking(booking)}
    disabled={cancellingBookingId === booking.id}
    className="rounded-card border border-danger/30 px-4 py-2.5 text-sm font-medium text-danger-text transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
  >
    {cancellingBookingId === booking.id
      ? 'Cancelling...'
      : 'Cancel appointment'}
  </button>
) : hasCancellableStatus(booking) ? (
  <div className="max-w-sm rounded-card border border-border bg-surface-muted px-4 py-3">
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Clock3 size={16} />
      Cancellation unavailable
    </div>

    <p className="mt-1 text-xs leading-relaxed text-muted">
      Appointments must be cancelled more than
      24 hours before the scheduled start time.
    </p>
  </div>
) : null}


        </div>
      </div>
    ))
  )}

</div>

{/* Pagination controls */}
{!loading && pagination.total_pages > 1 && (
  <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">

    <p className="text-sm text-muted">
      Page {pagination.page} of {pagination.total_pages}
      {' '}· {pagination.total_bookings} bookings
    </p>

    <div className="flex items-center gap-3">

      <button
        onClick={() => setPage((current) => current - 1)}
        disabled={!pagination.has_previous}
        className="inline-flex items-center gap-2 rounded-card border border-border px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <button
        onClick={() => setPage((current) => current + 1)}
        disabled={!pagination.has_next}
        className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight size={16} />
      </button>

    </div>
  </div>
)}





      <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default CustomerBookings
