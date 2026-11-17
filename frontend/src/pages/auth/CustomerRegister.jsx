
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'

import { registerCustomer } from '../../services/authService'

function CustomerRegister() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    try {
      setLoading(true)

      await registerCustomer({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
      })

      navigate('/customer/login', {
        state: {
          successMessage: 'Account created successfully! You can now sign in.',
        },
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to create your account. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        <Link
          to="/customer/login"
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-11 h-11 rounded-xl bg-[#647D68] text-white flex items-center justify-center">
            <Scissors size={21} />
          </div>

          <span className="text-2xl font-semibold tracking-tight">
            BookEase
          </span>
        </Link>

        <div className="bg-white border border-[#E7E8E4] rounded-2xl p-7 sm:p-9 shadow-sm">

          <div className="mb-7">
            <p className="text-sm text-[#647D68] font-medium mb-2">
              CUSTOMER ACCOUNT
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              Create your account
            </h1>

            <p className="text-sm text-[#777D76] mt-2">
              Join BookEase and manage your appointments with ease.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-2">
                Full name
              </label>

              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="w-full border border-[#DDE1DA] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full border border-[#DDE1DA] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone number <span className="text-[#929890]">(Optional)</span>
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 0712345678"
                className="w-full border border-[#DDE1DA] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                minLength={8}
                maxLength={72}
                className="w-full border border-[#DDE1DA] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Enter your password again"
                required
                className="w-full border border-[#DDE1DA] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#647D68] hover:bg-[#526A56] text-white font-medium rounded-lg py-3 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>

          <p className="text-sm text-center text-[#777D76] mt-7">
            Already have an account?{' '}
            <Link
              to="/customer/login"
              className="text-[#647D68] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default CustomerRegister
