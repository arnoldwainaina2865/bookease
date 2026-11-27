import api from './api'

export const getProviderAnalytics = async (
  filters = { period: '30' },
  signal
) => {
  const response = await api.get('/provider/analytics', {
    params: filters,
    signal,
  })

  return response.data
}
