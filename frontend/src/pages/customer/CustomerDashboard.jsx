
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
  const user = getCurrentUser()

  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
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
        setBookings(bookingsData.bookings || [])
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
  const confirmed = window.confirm(
    `Are you sure you want to cancel your ${booking.service} appointment?`
  )

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
      pending: 'bg-amber-50 text-amber-700',
      confirmed: 'bg-emerald-50 text-emerald-700',
      completed: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-50 text-red-700',
      rejected: 'bg-red-50 text-red-700',
    }

    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }


  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#202421]">
      

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="mb-9">
          <p className="text-sm text-[#777D76] mb-2">
            CUSTOMER WORKSPACE
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}.
          </h1>

          <p className="text-[#777D76] mt-2">
            Discover services and keep your appointments organised.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
  <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
    {successMessage}
  </div>
)}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          <div className="bg-white border border-[#E7E8E4] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#777D76]">Your bookings</p>
              <CalendarDays size={20} className="text-[#647D68]" />
            </div>

            <p className="text-3xl font-semibold mt-4">
              {loading ? '—' : bookings.length}
            </p>

            <p className="text-xs text-[#929890] mt-1">
              Recently retrieved bookings
            </p>
          </div>

          <div className="bg-white border border-[#E7E8E4] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#777D76]">Available services</p>
              <Scissors size={20} className="text-[#647D68]" />
            </div>

            <p className="text-3xl font-semibold mt-4">
              {loading ? '—' : services.length}
            </p>

            <p className="text-xs text-[#929890] mt-1">
              Services currently displayed
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">Explore services</h2>
              <p className="text-sm text-[#777D76] mt-1">
                Find a service that suits your needs.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[#777D76] py-8">
              Loading available services...
            </p>
          ) : services.length === 0 ? (
            <div className="bg-white border border-[#E7E8E4] rounded-xl p-8 text-center">
              <p className="text-sm text-[#777D76]">
                No services are currently available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="bg-white border border-[#E7E8E4] rounded-xl p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F0F3EF] text-[#647D68] flex items-center justify-center mb-4">
                    <Scissors size={19} />
                  </div>

                  <h3 className="font-semibold text-lg">
                    {service.name}
                  </h3>

                  <p className="text-sm text-[#777D76] mt-2 line-clamp-2">
                    {service.description || 'Service details available on request.'}
                  </p>

                  <div className="mt-5 pt-4 border-t border-[#E7E8E4] space-y-3">
                    <p className="font-semibold text-[#647D68]">
                      KSh {Number(service.price).toLocaleString('en-KE')}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[#777D76]">
                      <Clock3 size={14} />
                      {service.duration_minutes} minutes
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#777D76]">
                      <MapPin size={14} />
                      {service.provider?.location || 'Location not specified'}
                    </div>

                    <p className="text-xs text-[#202421] font-medium">
                      {service.provider?.business_name}
                      <Link
  to={`/customer/book?serviceId=${service.id}`}
  className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#647D68] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#526A56]"
>
  Book appointment
</Link>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Recent appointments</h2>
            <p className="text-sm text-[#777D76] mt-1">
              Keep track of your latest bookings.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-[#777D76] py-8">
              Loading appointments...
            </p>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-[#E7E8E4] rounded-xl p-8 text-center">
              <CalendarDays
                size={28}
                className="mx-auto text-[#929890] mb-3"
              />

              <h3 className="font-medium">No appointments yet</h3>

              <p className="text-sm text-[#777D76] mt-2">
                Your bookings will appear here once you make a reservation.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E7E8E4] rounded-xl divide-y divide-[#E7E8E4]">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-medium">
                      {booking.service}
                    </h3>

                    <p className="text-sm text-[#777D76] mt-1">
                      {booking.provider}
                    </p>

                    <p className="text-xs text-[#929890] mt-2">
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
      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
      </main>
    </div>
  )
}

export default CustomerDashboard
