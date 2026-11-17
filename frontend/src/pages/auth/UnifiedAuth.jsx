
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Scissors,
  Mail,
  LockKeyhole,
  UserRound,
  Store,
  Phone,
  MapPin,
  BriefcaseBusiness,
  ArrowRight,
} from 'lucide-react'

import {
  loginUser,
  logoutUser,
  registerUser,
} from '../../services/authService'

function UnifiedAuth() {
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState('customer')
  const [mode, setMode] = useState(
    location.pathname === '/customer/register' ||
    location.pathname === '/register'
      ? 'register'
      : 'login'
  )

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    category: '',
    location: '',
    description: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(
    location.state?.successMessage || ''
  )
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setError('')
    setSuccess('')
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const data = await loginUser(
          formData.email.trim(),
          formData.password
        )

        if (data.user.role !== role) {
          logoutUser()
          setError(
            `This account is registered as a ${data.user.role}. Please select ${data.user.role} to sign in.`
          )
          return
        }

        navigate(
          role === 'provider'
            ? '/provider/dashboard'
            : '/customer/dashboard',
          { replace: true }
        )

        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Your passwords do not match.')
        return
      }

      if (formData.password.length < 8) {
        setError('Password must contain at least 8 characters.')
        return
      }

      const userData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        role,
      }

      if (role === 'provider') {
        userData.business_name = formData.business_name.trim()
        userData.category = formData.category
        userData.location = formData.location.trim()
        userData.description = formData.description.trim()
      }

      await registerUser(userData)

      setSuccess(
        'Your account has been created successfully. You can now sign in.'
      )

      setMode('login')

      setFormData((previous) => ({
        ...previous,
        password: '',
        confirmPassword: '',
      }))
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#E7E8E4] bg-white px-4 py-3 text-sm text-[#202421] outline-none transition focus:border-[#647D68]'

  const labelClass =
    'mb-2 block text-sm font-medium text-[#343A35]'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-5 py-10">
      <section className="w-full max-w-lg">

        {/* Brand */}
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#647D68] text-white">
            <Scissors size={23} />
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#202421]">
            BookEase
          </h1>

          <p className="mt-2 text-sm text-[#777D76]">
            Your appointments, made simple.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7E8E4] bg-white p-6 shadow-sm sm:p-8">

          {/* Account type */}
          <div className="mb-7">
            <h2 className="mb-3 text-sm font-semibold text-[#202421]">
              I want to continue as
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  role === 'customer'
                    ? 'border-[#647D68] bg-[#EDF2ED] text-[#526D57]'
                    : 'border-[#E7E8E4] text-[#777D76] hover:bg-[#F7F7F5]'
                }`}
              >
                <UserRound size={18} />
                Customer
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('provider')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  role === 'provider'
                    ? 'border-[#647D68] bg-[#EDF2ED] text-[#526D57]'
                    : 'border-[#E7E8E4] text-[#777D76] hover:bg-[#F7F7F5]'
                }`}
              >
                <Store size={18} />
                Provider
              </button>
            </div>
          </div>

          {/* Sign in / Register tabs */}
          <div className="mb-7 grid grid-cols-2 border-b border-[#E7E8E4]">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                mode === 'login'
                  ? 'border-[#647D68] text-[#526D57]'
                  : 'border-transparent text-[#929890]'
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                mode === 'register'
                  ? 'border-[#647D68] text-[#526D57]'
                  : 'border-transparent text-[#929890]'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#202421]">
              {mode === 'login'
                ? 'Welcome back'
                : `Create your ${role} account`}
            </h2>

            <p className="mt-2 text-sm text-[#777D76]">
              {mode === 'login'
                ? `Sign in to access your ${role === 'provider' ? 'business workspace' : 'appointments and services'}.`
                : role === 'provider'
                  ? 'Set up your business profile and start managing bookings.'
                  : 'Join BookEase and discover services near you.'}
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {mode === 'register' && (
              <>
                <div>
                  <label className={labelClass}>
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                    />

                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {role === 'provider' && (
                  <>
                    <div>
                      <label className={labelClass}>
                        Business name
                      </label>

                      <div className="relative">
                        <Store
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                        />

                        <input
                          type="text"
                          name="business_name"
                          value={formData.business_name}
                          onChange={handleChange}
                          placeholder="Your business name"
                          required
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Business category
                      </label>

                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select a category</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Barbershop">Barbershop</option>
                        <option value="Hair Salon">Hair Salon</option>
                        <option value="Spa">Spa</option>
                        <option value="Massage">Massage</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Business location
                      </label>

                      <div className="relative">
                        <MapPin
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                        />

                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="e.g. Westlands, Nairobi"
                          required
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Business description
                        <span className="ml-1 font-normal text-[#929890]">
                          (Optional)
                        </span>
                      </label>

                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Tell customers about your business..."
                        className={inputClass}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Email */}
            <div>
              <label className={labelClass}>
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Phone */}
            {mode === 'register' && (
              <div>
                <label className={labelClass}>
                  Phone number
                  <span className="ml-1 font-normal text-[#929890]">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 0712345678"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className={labelClass}>
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Confirm password */}
            {mode === 'register' && (
              <div>
                <label className={labelClass}>
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                  />

                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#647D68] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#526D57] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}

              {!loading && <ArrowRight size={17} />}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-[#929890]">
            {role === 'provider'
              ? 'Manage your services and bookings with BookEase.'
              : 'Discover services and keep your appointments organised.'}
          </p>

        </div>
      </section>
    </main>
  )
}

export default UnifiedAuth
