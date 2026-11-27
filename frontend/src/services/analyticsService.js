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

export const downloadProviderReport = async (report, period) => {
  try {
    const response = await api.get('/provider/analytics/export', {
      params: {
        report,
        period: 'custom',
        start_date: period.start_date,
        end_date: period.end_date,
      },
      responseType: 'blob',
    })

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download =
      `bookease-${report}-${period.start_date}-${period.end_date}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    let message = 'Unable to download the report. Please try again.'

    if (error.response?.data instanceof Blob) {
      try {
        const result = JSON.parse(await error.response.data.text())
        message = result.message || message
      } catch {
        // Use the default message for non-JSON responses.
      }
    }

    throw new Error(message, { cause: error })
  }
}
