import api from './api'

// Retrieve publicly available services.
export async function getPublicServices({
  search = '',
  category = '',
  location = '',
  page = 1,
  perPage = 12,
  signal,
} = {}) {
  const params = {
    page,
    per_page: perPage,
  }

  if (search.trim()) {
    params.search = search.trim()
  }

  if (category.trim()) {
    params.category = category.trim()
  }

  if (location.trim()) {
    params.location = location.trim()
  }

  const response = await api.get('/services/', {
    params,
    signal,
  })

  return response.data
}

// Retrieve available appointment slots.
export async function getPublicServiceAvailability(
  serviceId,
  date,
  signal
) {
  const response = await api.get(
    `/services/${serviceId}/availability`,
    {
      params: { date },
      signal,
    }
  )

  return response.data
}
