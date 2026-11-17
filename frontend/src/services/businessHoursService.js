
import api from './api'

// Retrieve the authenticated provider's weekly business hours.
export const getProviderBusinessHours = async () => {
  const response = await api.get('/provider/business-hours')

  return response.data
}

// Update the authenticated provider's weekly business hours.
export const updateProviderBusinessHours = async (businessHours) => {
  const response = await api.put('/provider/business-hours', {
    business_hours: businessHours,
  })

  return response.data
}
