
import api from './api'

export const getProviderDashboard = async () => {
  const response = await api.get('/provider/dashboard')

  return response.data
}
