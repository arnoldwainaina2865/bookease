
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    rejected: 'bg-gray-100 text-gray-600',
  }

  return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#777D76]">
              Provider workspace
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[#202421]">
              Booking details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#777D76] transition-colors hover:bg-[#F7F7F5]"
            aria-label="Close booking details"
          >
            <XCircle size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <RefreshCw
              size={25}
              className="animate-spin text-[#647D68]"
            />

            <p className="mt-4 text-sm text-[#777D76]">
              Loading booking details...
            </p>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        ) : booking ? (
          <div className="mt-6 space-y-5">

            <div className="flex items-center justify-between rounded-xl bg-[#F7F7F5] p-4">
              <div>
                <p className="text-xs text-[#777D76]">
                  Booking reference
                </p>

                <p className="mt-1 text-lg font-semibold text-[#202421]">
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
              <h3 className="mb-3 text-sm font-semibold text-[#202421]">
                Customer information
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#777D76]">
                    Customer name
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#202421]">
                    {booking.customer?.full_name || 'Customer'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777D76]">
                    Email address
                  </p>

                  <p className="mt-1 text-sm text-[#202421]">
                    {booking.customer?.email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777D76]">
                    Phone number
                  </p>

                  <p className="mt-1 text-sm text-[#202421]">
                    {booking.customer?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-[#E7E8E4]" />

            <section>
              <h3 className="mb-3 text-sm font-semibold text-[#202421]">
                Appointment information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#777D76]">
                    Service
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#202421]">
                    {booking.service?.name || 'Service'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777D76]">
                    Duration
                  </p>

                  <p className="mt-1 text-sm text-[#202421]">
                    {booking.service?.duration_minutes || 0} minutes
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777D76]">
                    Start time
                  </p>

                  <p className="mt-1 text-sm text-[#202421]">
                    {formatDate(booking.start_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777D76]">
                    End time
                  </p>

                  <p className="mt-1 text-sm text-[#202421]">
                    {formatDate(booking.end_at)}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-[#E7E8E4]" />

            <section>
              <h3 className="mb-3 text-sm font-semibold text-[#202421]">
                Payment information
              </h3>

              <div className="rounded-xl border border-[#E7E8E4] p-4">
                <p className="text-xs text-[#777D76]">
                  Total booking amount
                </p>

                <p className="mt-1 text-xl font-semibold text-[#526D57]">
                  {formatCurrency(booking.total_price)}
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-[#202421]">
                Customer notes
              </h3>

              <p className="rounded-lg bg-[#F7F7F5] p-3 text-sm leading-relaxed text-[#777D76]">
                {booking.customer_notes || 'No notes provided.'}
              </p>
            </section>


            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#202421]">
                  Booking activity
                </h3>

                <span className="text-xs text-[#777D76]">
                  {activities.length} {activities.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {activitiesLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-[#777D76]">
                  <RefreshCw size={16} className="animate-spin text-[#647D68]" />
                  Loading booking activity...
                </div>
              ) : activitiesError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">
                    {activitiesError}
                  </p>
                </div>
              ) : activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E7E8E4] bg-[#F7F7F5] p-4">
                  <p className="text-sm font-medium text-[#202421]">
                    No activity recorded yet
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-[#777D76]">
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2ED] text-[#647D68]">
                          <CheckCircle2 size={16} />
                        </div>

                        {index !== activities.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-[#E7E8E4]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-1">
                        <p className="text-sm font-medium capitalize text-[#202421]">
                          {activity.action.replaceAll('_', ' ')}
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-[#777D76]">
                          {activity.description}
                        </p>

                        <p className="mt-2 text-xs text-[#92978F]">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>


            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[#647D68] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#526D57]"
            >
              Close details
            </button>

          </div>
        ) : null}
      </div>
    </div>
  )
}


function Bookings() {
  const location = useLocation()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState(null)

  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

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
  
  


  // Retrieve provider bookings
  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccessMessage('')

      const data = await getProviderBookings({
        page,
        per_page: 10,
        status,
      })

      setBookings(data.bookings || [])
      setPagination(data.pagination || null)

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve bookings. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchBookings()
  }, [page, status])


  // Open a specific booking received through navigation state
  useEffect(() => {
    const bookingId = location.state?.focusBookingId

    if (!bookingId) return

    let cancelled = false

    const fetchSelectedBooking = async () => {
      try {
        setDetailsLoading(true)
        setDetailsError('')
        setSelectedBooking(null)

        const data = await getProviderBooking(bookingId)

        if (!cancelled) {
          setSelectedBooking(data.booking || data)
        }

      } catch (err) {
        if (!cancelled) {
          setDetailsError(
            err.response?.data?.message ||
            'Unable to retrieve booking details.'
          )
        }
      } finally {
        if (!cancelled) {
          setDetailsLoading(false)

          navigate(location.pathname, {
            replace: true,
            state: {},
          })
        }
      }
    }

    fetchSelectedBooking()

    return () => {
      cancelled = true
    }
  }, [location.state?.focusBookingId])
  // Retrieve the activity timeline for the selected booking.
useEffect(() => {
  if (!selectedBooking?.id) {
    setActivities([])
    setActivitiesError('')
    setActivitiesLoading(false)
    return
  }

  let active = true

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true)
      setActivitiesError('')

      const data = await getProviderBookingActivities(
        selectedBooking.id
      )

      if (active) {
        setActivities(data.activities || [])
      }

    } catch (err) {
      if (active) {
        setActivities([])
        setActivitiesError(
          err.response?.data?.message ||
          'Unable to load booking activity.'
        )
      }
    } finally {
      if (active) {
        setActivitiesLoading(false)
      }
    }
  }

  fetchActivities()

  return () => {
    active = false
  }
}, [selectedBooking?.id])


  // Close booking details
  const closeBookingDetails = () => {
    setSelectedBooking(null)
    setDetailsError('')
    setDetailsLoading(false)
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

      await fetchBookings()

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
      endTime.getTime() <= Date.now()
    )
  }


  const handleFilterChange = (newStatus) => {
    setStatus(newStatus)
    setPage(1)
  }


  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* Page heading */}
        <header>
          <p className="text-sm text-[#777D76]">
            Provider workspace
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#202421]">
            Bookings
          </h1>

          <p className="mt-1 text-sm text-[#777D76]">
            Manage customer appointments and booking requests.
          </p>
        </header>


        {/* Booking filters */}
        <section className="flex flex-col gap-4 rounded-xl border border-[#E7E8E4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#202421]">
              All bookings
            </h2>

            <p className="mt-1 text-sm text-[#777D76]">
              View and manage your customer reservations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="rounded-lg border border-[#E7E8E4] bg-white px-3 py-2.5 text-sm text-[#202421] outline-none focus:border-[#647D68]"
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
              onClick={fetchBookings}
              disabled={loading}
              title="Refresh bookings"
              className="rounded-lg border border-[#E7E8E4] p-2.5 text-[#777D76] transition-colors hover:bg-[#F7F7F5] disabled:opacity-50"
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
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}

            <button
              type="button"
              onClick={fetchBookings}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}


        {/* Bookings table */}
        <section className="overflow-hidden rounded-xl border border-[#E7E8E4] bg-white">

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <RefreshCw
                size={25}
                className="animate-spin text-[#647D68]"
              />

              <p className="mt-4 text-sm text-[#777D76]">
                Loading bookings...
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CalendarDays
                size={32}
                className="mx-auto text-[#999E98]"
              />

              <h3 className="mt-4 font-medium text-[#202421]">
                No bookings found
              </h3>

              <p className="mt-2 text-sm text-[#777D76]">
                There are no bookings matching this status.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">

                  <thead className="bg-[#FAFAF9] text-xs text-[#777D76]">
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

                  <tbody className="divide-y divide-[#E7E8E4]">
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-[#FAFAF9]"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#202421]">
                            {booking.customer?.full_name || 'Customer'}
                          </p>

                          <p className="mt-1 text-xs text-[#999E98]">
                            {booking.customer?.email || 'No email'}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-[#202421]">
                            {booking.service?.name || 'Service'}
                          </p>

                          <p className="mt-1 text-xs text-[#999E98]">
                            {booking.service?.duration_minutes || 0} minutes
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-[#202421]">
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

                        <td className="px-6 py-4 text-right font-medium text-[#202421]">
                          {formatCurrency(booking.total_price)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">

                            {booking.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoading === booking.id}
                                  onClick={() => handleBookingAction(booking, 'confirm')}
                                  title="Confirm booking"
                                  className="rounded-lg bg-[#647D68] p-2 text-white transition-colors hover:bg-[#526D57] disabled:opacity-50"
                                >
                                  <CheckCircle2 size={16} />
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoading === booking.id}
                                  onClick={() => handleBookingAction(booking, 'reject')}
                                  title="Reject booking"
                                  className="rounded-lg border border-[#E7E8E4] p-2 text-[#777D76] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
                                className="rounded-lg border border-[#E7E8E4] px-3 py-2 text-xs font-medium text-[#526D57] transition-colors hover:bg-[#EEF2ED] disabled:opacity-50"
                              >
                                Complete
                              </button>
                            )}

                            {actionLoading === booking.id && (
                              <RefreshCw
                                size={16}
                                className="animate-spin text-[#647D68]"
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
              <div className="flex flex-col gap-3 border-t border-[#E7E8E4] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#777D76]">
                  {pagination?.total_bookings || 0} total bookings
                  {' · '}
                  Page {pagination?.page || page} of {pagination?.total_pages || 1}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination?.has_previous || loading}
                    onClick={() => setPage((current) => current - 1)}
                    className="flex items-center gap-1 rounded-lg border border-[#E7E8E4] px-3 py-2 text-xs font-medium text-[#777D76] hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={!pagination?.has_next || loading}
                    onClick={() => setPage((current) => current + 1)}
                    className="flex items-center gap-1 rounded-lg border border-[#E7E8E4] px-3 py-2 text-xs font-medium text-[#777D76] hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-40"
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
      {(detailsLoading || selectedBooking || detailsError) && (
        <BookingDetailsModal
  booking={selectedBooking}
  loading={detailsLoading}
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
