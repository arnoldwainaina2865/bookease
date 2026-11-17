
import api from './api'

// Retrieve bookings belonging to the authenticated provider.
export const getProviderBookings = async ({
  page = 1,
  per_page = 10,
  status = '',
} = {}) => {
  const params = { page, per_page }

  if (status) {
    params.status = status
  }

  const response = await api.get('/provider/bookings', {
    params,
  })

  return response.data
}

// Retrieve the details of one provider booking.
export const getProviderBooking = async (bookingId) => {
  const response = await api.get(`/provider/bookings/${bookingId}`)
  return response.data
}
// Retrieve the activity timeline for one provider booking.
export const getProviderBookingActivities = async (bookingId) => {
  const response = await api.get(
    `/provider/bookings/${bookingId}/activities`
  )

  return response.data
}

// Confirm a pending booking.
export const confirmBooking = async (bookingId) => {
  const response = await api.patch(
    `/provider/bookings/${bookingId}/confirm`
  )

  return response.data
}

// Reject a pending booking.
export const rejectBooking = async (bookingId) => {
  const response = await api.patch(
    `/provider/bookings/${bookingId}/reject`
  )

  return response.data
}

// Complete a confirmed booking after its scheduled end time.
export const completeBooking = async (bookingId) => {
  const response = await api.patch(
    `/provider/bookings/${bookingId}/complete`
  )

  return response.data
}
