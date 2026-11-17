
import api from './api'

// Retrieve customers belonging to the authenticated provider.
export const getProviderCustomers = async ({
  page = 1,
  per_page = 10,
  search = '',
} = {}) => {
  const params = {
    page,
    per_page,
  }

  if (search.trim()) {
    params.search = search.trim()
  }

  const response = await api.get('/provider/customers', {
    params,
  })

  return response.data
}
// Retrieve one customer's profile and booking history.
export const getProviderCustomerDetails = async (customerId) => {
  const response = await api.get(`/provider/customers/${customerId}`)

  return response.data
}