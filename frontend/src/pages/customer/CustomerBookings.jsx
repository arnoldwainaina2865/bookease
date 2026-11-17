
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
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }

  return styles[status?.toLowerCase()] ||
    'bg-gray-100 text-gray-600 border-gray-200'
}
const STATUS_TABS = [
  { label: 'All bookings', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

function CustomerBookings() {
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
  const confirmed = window.confirm(
    `Are you sure you want to cancel your ${booking.service} appointment?`
  )

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
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#285C43]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#52745E]">
                Customer workspace
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                My bookings
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                View and manage all your appointments in one place.
              </p>
            </div>

            <Link
              to="/customer/book"
              className="inline-flex items-center justify-center rounded-xl bg-[#285C43] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1F4935]"
            >
              Book a service
            </Link>
          </div>
        </div>
{/* Booking filters */}
<div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

  {/* Search */}
  <div className="relative mb-6">
    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type="text"
      placeholder="Search by service or provider..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-[#FAFAF8] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#52745E] focus:ring-2 focus:ring-[#52745E]/10"
    />
  </div>

  {/* Status tabs */}
  <div className="flex flex-wrap gap-2">
    {STATUS_TABS.map((tab) => (
      <button
        key={tab.value || 'all'}
        onClick={() => handleStatusChange(tab.value)}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
          activeStatus === tab.value
            ? 'bg-[#285C43] text-white'
            : 'bg-[#F4F5F2] text-gray-600 hover:bg-[#E9EEE9]'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>

</div>

{/* Feedback messages */}
{error && (
  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {error}
  </div>
)}

{successMessage && (
  <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
    {successMessage}
  </div>
)}
{/* Booking cards */}
<div className="space-y-4">

  {loading ? (
    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
      <p className="text-sm text-gray-500">
        Loading your bookings...
      </p>
    </div>
  ) : filteredBookings.length === 0 ? (
    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
      <CalendarDays
        size={36}
        className="mx-auto mb-4 text-gray-400"
      />

      <h3 className="text-lg font-semibold text-[#24352B]">
        No bookings found
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {searchTerm
          ? 'Try a different search term.'
          : 'You have no bookings in this category yet.'}
      </p>

      {!searchTerm && (
        <Link
          to="/customer/book"
          className="mt-5 inline-flex rounded-xl bg-[#285C43] px-5 py-3 text-sm font-medium text-white hover:bg-[#1F4935]"
        >
          Book a service
        </Link>
      )}
    </div>
  ) : (
    filteredBookings.map((booking) => (
      <div
        key={booking.id}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
      >
        {/* Service and status */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

          <div>
            <h3 className="text-lg font-semibold text-[#24352B]">
              {booking.service}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
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
        <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">

          <div className="flex items-center gap-3">
            <CalendarDays
              size={19}
              className="text-[#52745E]"
            />

            <div>
              <p className="text-xs text-gray-400">
                Appointment date
              </p>
              <p className="text-sm font-medium text-gray-700">
                {formatDate(booking.start_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock3
              size={19}
              className="text-[#52745E]"
            />

            <div>
              <p className="text-xs text-gray-400">
                Appointment time
              </p>
              <p className="text-sm font-medium text-gray-700">
                {formatTime(booking.start_at)}
              </p>
            </div>
          </div>

        </div>

        {/* Price and cancellation */}
        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">

          <div>
            <p className="text-xs text-gray-400">
              Total price
            </p>
            <p className="text-lg font-semibold text-[#285C43]">
              {formatPrice(booking.total_price)}
            </p>
          </div>

          
{canCancelBooking(booking, currentTime) ? (
  <button
    onClick={() => handleCancelBooking(booking)}
    disabled={cancellingBookingId === booking.id}
    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {cancellingBookingId === booking.id
      ? 'Cancelling...'
      : 'Cancel appointment'}
  </button>
) : hasCancellableStatus(booking) ? (
  <div className="max-w-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Clock3 size={16} />
      Cancellation unavailable
    </div>

    <p className="mt-1 text-xs leading-relaxed text-gray-500">
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
  <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">

    <p className="text-sm text-gray-500">
      Page {pagination.page} of {pagination.total_pages}
      {' '}· {pagination.total_bookings} bookings
    </p>

    <div className="flex items-center gap-3">

      <button
        onClick={() => setPage((current) => current - 1)}
        disabled={!pagination.has_previous}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <button
        onClick={() => setPage((current) => current + 1)}
        disabled={!pagination.has_next}
        className="inline-flex items-center gap-2 rounded-xl bg-[#285C43] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1F4935] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight size={16} />
      </button>

    </div>
  </div>
)}



        

      </div>
  )
}

export default CustomerBookings
