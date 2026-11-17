
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