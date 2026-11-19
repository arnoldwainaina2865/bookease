
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserRound,
  X,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'

import {
  getProviderBookings,
  getProviderBooking,
  getProviderBookingActivities,
  confirmBooking,
  rejectBooking,
  completeBooking,
} from '../../services/bookingService'


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
    pending: 'bg-warning-soft text-warning-text',
    confirmed: 'bg-info-soft text-info-text',
    completed: 'bg-success-soft text-success-text',
    cancelled: 'bg-danger-soft text-danger-text',
    rejected: 'bg-surface-muted text-muted',
  }

  return styles[status?.toLowerCase()] || 'bg-surface-muted text-muted'
}


// Booking details modal
function BookingDetailsModal({
  booking,
  loading,
  error,
  activities,
  activitiesLoading,
  activitiesError,
  onClose,
}) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus()
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs text-muted">
              Provider workspace
            </p>

            <h2 id="booking-details-title" className="mt-1 text-lg font-semibold text-foreground">
              Booking details
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-border text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Close booking details"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <RefreshCw
              size={25}
              className="animate-spin text-primary"
            />

            <p className="mt-4 text-sm text-muted">
              Loading booking details...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-button border border-danger/30 bg-danger-soft p-4">
            <p className="text-sm text-danger-text">
              {error}
            </p>
          </div>
        ) : booking ? (
          <div className="space-y-5">

            <div className="flex items-center justify-between rounded-card bg-surface-muted p-4">
              <div>
                <p className="text-xs text-muted">
                  Booking reference
                </p>

                <p className="mt-1 text-lg font-semibold text-foreground">
                  #{booking.id}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
              >
                {booking.status}
              </span>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Customer information
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted">
                    Customer name
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {booking.customer?.full_name || 'Customer'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Email address
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {booking.customer?.email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Phone number
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {booking.customer?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Appointment information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted">
                    Service
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {booking.service?.name || 'Service'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Duration
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {booking.service?.duration_minutes || 0} minutes
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    Start time
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(booking.start_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">
                    End time
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(booking.end_at)}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Payment information
              </h3>

              <div className="rounded-card border border-border p-4">
                <p className="text-xs text-muted">
                  Total booking amount
                </p>

                <p className="mt-1 text-xl font-semibold text-primary">
                  {formatCurrency(booking.total_price)}
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Customer notes
              </h3>

              <p className="rounded-button bg-surface-muted p-3 text-sm leading-relaxed text-muted">
                {booking.customer_notes || 'No notes provided.'}
              </p>
            </section>


            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Booking activity
                </h3>

                <span className="text-xs text-muted">
                  {activities.length} {activities.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {activitiesLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted">
                  <RefreshCw size={16} className="animate-spin text-primary" />
                  Loading booking activity...
                </div>
              ) : activitiesError ? (
                <div className="rounded-button border border-danger/30 bg-danger-soft p-3">
                  <p className="text-sm text-danger-text">
                    {activitiesError}
                  </p>
                </div>
              ) : activities.length === 0 ? (
                <div className="rounded-button border border-dashed border-border bg-surface-muted p-4">
                  <p className="text-sm font-medium text-foreground">
                    No activity recorded yet
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Booking events will appear here as the booking progresses.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="relative flex gap-3 pb-5 last:pb-0"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <CheckCircle2 size={16} />
                        </div>

                        {index !== activities.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-1">
                        <p className="text-sm font-medium capitalize text-foreground">
                          {activity.action.replaceAll('_', ' ')}
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {activity.description}
                        </p>

                        <p className="mt-2 text-xs text-muted">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>




          </div>
        ) : null}
        </div>

        {/* Always-visible modal footer */}
        <div className="shrink-0 border-t border-border bg-surface px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-button bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Close details
          </button>
        </div>
      </div>
    </div>
  )
}


function Bookings() {
  const location = useLocation()
  const navigate = useNavigate()

  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const bookingRequestRef = useRef(0)
  const detailsRequestRef = useRef(0)
  const activityRequestRef = useRef(0)

  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState(null)

  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const [selectedBooking, setSelectedBooking] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState('')




  // Retrieve provider bookings.
  const fetchBookings = useCallback(() => {
    const requestId = ++bookingRequestRef.current

    return getProviderBookings({
      page,
      per_page: 10,
      status,
    })
      .then((data) => {
        if (requestId !== bookingRequestRef.current) return

        setBookings(data.bookings || [])
        setPagination(data.pagination || null)
        setError('')
      })
      .catch((err) => {
        if (requestId !== bookingRequestRef.current) return

        setError(
          err.response?.data?.message ||
          'Unable to retrieve bookings. Please try again.'
        )
      })
      .finally(() => {
        if (requestId === bookingRequestRef.current) {
          setLoading(false)
        }
      })
  }, [page, status])

  useEffect(() => {
    fetchBookings()

    return () => {
      bookingRequestRef.current += 1
    }
  }, [fetchBookings, refreshKey])

  const refreshBookings = () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    setRefreshKey((current) => current + 1)
  }

  // Retrieve details and activity for a selected booking.
  const fetchBookingDetails = useCallback(async (bookingId) => {
    const requestId = ++detailsRequestRef.current

    try {
      const data = await getProviderBooking(bookingId)

      if (requestId !== detailsRequestRef.current) return

      const booking = data.booking || data

      setSelectedBooking(booking)
      setDetailsError('')
      setActivities([])
      setActivitiesError('')
      setActivitiesLoading(true)

      const activityRequestId = ++activityRequestRef.current

      try {
        const activityData = await getProviderBookingActivities(
          booking.id
        )

        if (
          requestId === detailsRequestRef.current &&
          activityRequestId === activityRequestRef.current
        ) {
          setActivities(activityData.activities || [])
        }
      } catch (err) {
        if (
          requestId === detailsRequestRef.current &&
          activityRequestId === activityRequestRef.current
        ) {
          setActivitiesError(
            err.response?.data?.message ||
            'Unable to load booking activity.'
          )
        }
      } finally {
        if (
          requestId === detailsRequestRef.current &&
          activityRequestId === activityRequestRef.current
        ) {
          setActivitiesLoading(false)
        }
      }
    } catch (err) {
      if (requestId === detailsRequestRef.current) {
        setDetailsError(
          err.response?.data?.message ||
          'Unable to retrieve booking details.'
        )
      }
    } finally {
      if (requestId === detailsRequestRef.current) {
        setDetailsLoading(false)
      }
    }
  }, [])

  // Open a booking received through navigation state.
  const focusBookingId = location.state?.focusBookingId

  useEffect(() => {
    if (!focusBookingId) return

    let active = true

    const loadFocusedBooking = async () => {
      await fetchBookingDetails(focusBookingId)

      if (active) {
        navigate(location.pathname, {
          replace: true,
          state: {},
        })
      }
    }

    loadFocusedBooking()

    return () => {
      active = false
      detailsRequestRef.current += 1
      activityRequestRef.current += 1
    }
  }, [focusBookingId, fetchBookingDetails, location.pathname, navigate])

  // Open booking details directly from the booking list.
  const openBookingDetails = (bookingId) => {
    setSelectedBooking(null)
    setDetailsError('')
    setDetailsLoading(true)
    setActivities([])
    setActivitiesError('')
    setActivitiesLoading(false)

    fetchBookingDetails(bookingId)
  }

  // Close booking details and invalidate outstanding requests.
  const closeBookingDetails = () => {
    detailsRequestRef.current += 1
    activityRequestRef.current += 1

    setSelectedBooking(null)
    setDetailsError('')
    setDetailsLoading(false)
    setActivities([])
    setActivitiesError('')
    setActivitiesLoading(false)

    if (focusBookingId) {
      navigate(location.pathname, {
        replace: true,
        state: {},
      })
    }
  }


  // Confirm, reject or complete a booking
  const handleBookingAction = async (booking, action) => {
    const messages = {
      confirm: 'Are you sure you want to confirm this booking?',
      reject: 'Are you sure you want to reject this booking?',
      complete: 'Mark this booking as completed?',
    }

    if (!window.confirm(messages[action])) {
      return
    }

    try {
      setActionLoading(booking.id)
      setError('')
      setSuccessMessage('')

      let result

      if (action === 'confirm') {
        result = await confirmBooking(booking.id)
      } else if (action === 'reject') {
        result = await rejectBooking(booking.id)
      } else if (action === 'complete') {
        result = await completeBooking(booking.id)
      }

      setSuccessMessage(
        result?.message || 'Booking updated successfully.'
      )

      setLoading(true)
      setRefreshKey((current) => current + 1)

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update this booking. Please try again.'
      )
    } finally {
      setActionLoading(null)
    }
  }


  // Determine whether a confirmed booking can be completed
  const canComplete = (booking) => {
    if (booking.status !== 'confirmed') return false

    const endTime = new Date(booking.end_at)

    return (
      !Number.isNaN(endTime.getTime()) &&
      endTime.getTime() <= currentTime
    )
  }


  const handleFilterChange = (newStatus) => {
    if (newStatus === status) return

    setLoading(true)
    setError('')
    setSuccessMessage('')
    setStatus(newStatus)
    setPage(1)
  }

  const handlePageChange = (direction) => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    setPage((current) => current + direction)
  }


  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* Page heading */}
        <header>
          <p className="text-sm text-muted">
            Provider workspace
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Bookings
          </h1>

          <p className="mt-1 text-sm text-muted">
            Manage customer appointments and booking requests.
          </p>
        </header>


        {/* Booking filters */}
        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              All bookings
            </h2>

            <p className="mt-1 text-sm text-muted">
              View and manage your customer reservations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="rounded-button border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={refreshBookings}
              disabled={loading}
              title="Refresh bookings"
              className="rounded-button border border-border p-2.5 text-muted transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </section>


        {/* Notifications */}
        {successMessage && (
          <div className="rounded-button border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-button border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
            {error}

            <button
              type="button"
              onClick={refreshBookings}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}


        {/* Bookings table */}
        <section className="overflow-hidden rounded-card border border-border bg-surface">

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <RefreshCw
                size={25}
                className="animate-spin text-primary"
              />

              <p className="mt-4 text-sm text-muted">
                Loading bookings...
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CalendarDays
                size={32}
                className="mx-auto text-muted"
              />

              <h3 className="mt-4 font-medium text-foreground">
                No bookings found
              </h3>

              <p className="mt-2 text-sm text-muted">
                There are no bookings matching this status.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile booking cards */}
              <div className="space-y-3 p-3 lg:hidden">
                {bookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="min-w-0 rounded-card border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-semibold text-foreground">
                          {booking.service?.name || 'Service'}
                        </h3>

                        <p className="mt-1 text-xs text-muted">
                          {booking.service?.duration_minutes || 0} minutes
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div className="flex items-start gap-2.5">
                        <UserRound
                          size={17}
                          className="mt-0.5 shrink-0 text-muted"
                          aria-hidden="true"
                        />

                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-foreground">
                            {booking.customer?.full_name || 'Customer'}
                          </p>

                          <p className="mt-1 break-all text-xs text-muted">
                            {booking.customer?.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <CalendarDays
                          size={17}
                          className="shrink-0 text-muted"
                          aria-hidden="true"
                        />

                        <p className="text-sm text-muted">
                          {formatDate(booking.start_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted">
                          Booking amount
                        </p>

                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatCurrency(booking.total_price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openBookingDetails(booking.id)}
                        className="flex min-h-10 items-center gap-2 rounded-button bg-primary-soft px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-surface-muted"
                      >
                        <Eye size={16} aria-hidden="true" />
                        View details
                      </button>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={actionLoading === booking.id}
                          onClick={() => handleBookingAction(booking, 'confirm')}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-button bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Confirm
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading === booking.id}
                          onClick={() => handleBookingAction(booking, 'reject')}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-button border border-border px-3 py-2.5 text-sm font-medium text-danger-text hover:bg-danger-soft disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}

                    {canComplete(booking) && (
                      <button
                        type="button"
                        disabled={actionLoading === booking.id}
                        onClick={() => handleBookingAction(booking, 'complete')}
                        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-button border border-border px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        Mark as completed
                      </button>
                    )}

                    {actionLoading === booking.id && (
                      <div
                        role="status"
                        className="mt-3 flex items-center justify-center gap-2 text-xs text-muted"
                      >
                        <RefreshCw
                          size={15}
                          className="animate-spin text-primary"
                        />
                        Updating booking...
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Desktop bookings table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">

                  <thead className="bg-surface-muted text-xs text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">
                        Customer
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Service
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Appointment
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-surface-muted"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">
                            {booking.customer?.full_name || 'Customer'}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {booking.customer?.email || 'No email'}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">
                            {booking.service?.name || 'Service'}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {booking.service?.duration_minutes || 0} minutes
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-foreground">
                            {formatDate(booking.start_at)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {formatCurrency(booking.total_price)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openBookingDetails(booking.id)}
                              title="View booking details"
                              aria-label="View booking details"
                              className="rounded-button border border-border p-2 text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                            >
                              <Eye size={16} aria-hidden="true" />
                            </button>

                            {booking.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoading === booking.id}
                                  onClick={() => handleBookingAction(booking, 'confirm')}
                                  title="Confirm booking"
                                  className="rounded-button bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                                >
                                  <CheckCircle2 size={16} />
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoading === booking.id}
                                  onClick={() => handleBookingAction(booking, 'reject')}
                                  title="Reject booking"
                                  className="rounded-button border border-border p-2 text-muted transition-colors hover:bg-danger-soft hover:text-danger-text disabled:opacity-50"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}

                            {canComplete(booking) && (
                              <button
                                type="button"
                                disabled={actionLoading === booking.id}
                                onClick={() => handleBookingAction(booking, 'complete')}
                                title="Mark as completed"
                                className="rounded-button border border-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
                              >
                                Complete
                              </button>
                            )}

                            {actionLoading === booking.id && (
                              <RefreshCw
                                size={16}
                                className="animate-spin text-primary"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted">
                  {pagination?.total_bookings || 0} total bookings
                  {' · '}
                  Page {pagination?.page || page} of {pagination?.total_pages || 1}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination?.has_previous || loading}
                    onClick={() => handlePageChange(-1)}
                    className="flex items-center gap-1 rounded-button border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={!pagination?.has_next || loading}
                    onClick={() => handlePageChange(1)}
                    className="flex items-center gap-1 rounded-button border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>


      {/* Booking details modal */}
      {(focusBookingId || detailsLoading || selectedBooking || detailsError) && (
        <BookingDetailsModal
  booking={selectedBooking}
  loading={detailsLoading || Boolean(focusBookingId && !selectedBooking && !detailsError)}
  error={detailsError}
  activities={activities}
  activitiesLoading={activitiesLoading}
  activitiesError={activitiesError}
  onClose={closeBookingDetails}
/>
      )}

    </DashboardLayout>
  )
}

export default Bookings
