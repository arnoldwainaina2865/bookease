
import api from './api'

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  })

  const { access_token, user } = response.data

  if (!access_token || !user) {
    throw new Error('Invalid login response from server.')
  }

  // Store authentication details.
  localStorage.setItem('access_token', access_token)
  localStorage.setItem('user', JSON.stringify(user))

  return response.data
}

export const logoutUser = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}
const logoutRequests = new Map()

export const secureLogoutUser = async () => {
  const token = localStorage.getItem('access_token')

  if (!token) {
    logoutUser()

    return {
      success: true,
      status: 'no_session',
      warning: null,
    }
  }

  // Reuse pending logout requests for the same JWT only.
  if (logoutRequests.has(token)) {
    return logoutRequests.get(token)
  }

  const logoutRequest = (async () => {
    try {
      const response = await api.post(
        '/auth/logout',
        null,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data?.success !== true) {
        throw new Error('Unexpected logout response.')
      }

      return {
        success: true,
        status: 'revoked',
        warning: null,
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.msg

      // An expired JWT can no longer authenticate requests.
      if (status === 401 && message === 'Token has expired') {
        return {
          success: true,
          status: 'expired',
          warning: null,
        }
      }

      // Do not assume other authentication failures
      // prove permanent server-side revocation.
      return {
        success: false,
        status: 'local_only',
        warning:
          'You have been signed out on this device, but we could not confirm server-side session revocation.',
      }
    } finally {
      // Do not clear a different authenticated session.
      if (localStorage.getItem('access_token') === token) {
        logoutUser()
      }
    }
  })()

  logoutRequests.set(token, logoutRequest)

  try {
    return await logoutRequest
  } finally {
    logoutRequests.delete(token)
  }
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')

  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem('access_token'))
}

// Register either a customer or a service provider.
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData)

  return response.data
}

// Keep this alias so the existing registration page still works.
export const registerCustomer = registerUser
