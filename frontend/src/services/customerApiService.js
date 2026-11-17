
import api from './api'

// Retrieve the public service catalogue.
export const getAvailableServices = async ({
  page = 1,
  per_page = 10,
  search = '',
  category = '',
  location = '',
} = {}) => {
  const params = { page, per_page }

  if (search.trim()) params.search = search.trim()
  if (category.trim()) params.category = category.trim()
  if (location.trim()) params.location = location.trim()

  const response = await api.get('/services/', { params })
  return response.data
}

// Retrieve available appointment slots for a service and date.
export const getServiceAvailability = async (
  serviceId,
  appointmentDate
) => {
  const response = await api.get(
    `/services/${serviceId}/availability`,
    {
      params: {
        date: appointmentDate,
      },
    }
  )

  return response.data
}

// Retrieve the authenticated customer's profile.
export const getCustomerProfile = async () => {
  const response = await api.get('/customer/profile')
  return response.data
}

// Update the authenticated customer's profile.
export const updateCustomerProfile = async (profileData) => {
  const response = await api.put('/customer/profile', profileData)
  return response.data
}

// Retrieve the authenticated customer's bookings.
export const getCustomerBookings = async ({
  page = 1,
  per_page = 10,
  status = '',
} = {}) => {
  const response = await api.get('/customer/bookings', {
    params: {
      page,
      per_page,
      ...(status && { status }),
    },
  })

  return response.data
}

// Create a customer booking.
export const createCustomerBooking = async (bookingData) => {
  const response = await api.post('/customer/bookings', bookingData)
  return response.data
}

// Cancel one of the authenticated customer's bookings.
export const cancelCustomerBooking = async (bookingId) => {
  const response = await api.patch(
    `/customer/bookings/${bookingId}/cancel`
  )

  return response.data
}
