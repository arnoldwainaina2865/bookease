
import api from './api'

// Retrieve all services belonging to the authenticated provider.
export const getProviderServices = async () => {
  const response = await api.get('/provider/services')
  return response.data
}

// Create a new provider service.
export const createProviderService = async (serviceData) => {
  const response = await api.post(
    '/provider/services',
    serviceData
  )

  return response.data
}

// Update an existing provider service.
export const updateProviderService = async (serviceId, serviceData) => {
  const response = await api.put(
    `/provider/services/${serviceId}`,
    serviceData
  )

  return response.data
}

// Deactivate a provider service.
export const deactivateProviderService = async (serviceId) => {
  const response = await api.delete(
    `/provider/services/${serviceId}`
  )

  return response.data
}
