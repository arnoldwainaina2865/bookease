
import { useState } from 'react'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Scissors,
  Mail,
  LockKeyhole,
  UserRound,
  Store,
  Phone,
  MapPin,
  ArrowRight,
  TriangleAlert,
} from 'lucide-react'

import {
  loginUser,
  logoutUser,
  registerUser,
} from '../../services/authService'

function UnifiedAuth() {
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState(
    new URLSearchParams(location.search).get('role') === 'provider'
      ? 'provider'
      : 'customer'
  )
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

    const [logoutWarning, setLogoutWarning] = useState(
    location.state?.logoutWarning || ''
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
            : /^[1-9][0-9]*$/.test(
                new URLSearchParams(location.search).get('serviceId') || ''
              )
              ? `/customer/book?serviceId=${new URLSearchParams(location.search).get('serviceId')}`
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
    'w-full rounded-input border border-border bg-surface px-4 py-3.5 text-sm text-foreground placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft'

  const labelClass =
    'mb-2 block text-sm font-medium text-foreground'

  return (
    <main className="relative isolate min-h-screen bg-[#142B20] px-4 py-8 sm:px-8 lg:py-12">

      {/* Luxury photographic background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/auth-background.png')",
        }}
      />

      {/* Background overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-black/45"
      />

      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-6xl items-center">

        <section className="grid w-full overflow-hidden rounded-[28px] border border-[#C9A66B]/40 shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">

          {/* Luxury branding panel */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#142B20]/95 p-12 text-[#F5EFE5] lg:flex xl:p-16">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full border border-[#C9A66B]/15"
            />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A66B]/50 text-[#D7BA85]">
                <Scissors size={27} strokeWidth={1.5} />
              </div>

              <span className="font-serif text-4xl tracking-tight">
                BookEase
              </span>
            </div>

            <div className="relative py-16">
              <p className="mb-7 text-xs font-medium uppercase tracking-[0.28em] text-[#D7BA85]">
                A better way to book
              </p>

              <div className="mb-8 h-px w-20 bg-[#C9A66B]" />

              <h1 className="font-serif text-5xl font-normal leading-[1.12] tracking-tight xl:text-6xl">
                Make time for
                <span className="block italic text-[#D7BA85]">
                  what matters.
                </span>
              </h1>

              <p className="mt-7 max-w-sm text-base leading-relaxed text-[#D1DDD4]">
                Discover exceptional services, manage your appointments,
                and make every moment count.
              </p>
            </div>

            <div className="relative border-t border-[#C9A66B]/25 pt-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D7BA85]">
                Beauty · Wellness · Lifestyle
              </p>
            </div>

          </aside>

          {/* Theme-aware authentication panel */}
<div className="bg-surface/85 backdrop-blur-md px-6 py-8 text-foreground sm:px-10 lg:p-12 xl:p-14">
            <div className="mb-8 flex items-center justify-between gap-4">

              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-button bg-primary text-primary-foreground">
                  <Scissors size={20} />
                </div>

                <span className="font-serif text-2xl text-foreground">
                  BookEase
                </span>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Your personal workspace
                </p>
              </div>

              <ThemeToggle />

            </div>

          {/* Account type */}
          <div className="mb-7">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              I want to continue as
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`flex items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-medium transition ${
                  role === 'customer'
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border text-muted hover:bg-surface-muted'
                }`}
              >
                <UserRound size={18} />
                Customer
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('provider')}
                className={`flex items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-medium transition ${
                  role === 'provider'
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border text-muted hover:bg-surface-muted'
                }`}
              >
                <Store size={18} />
                Provider
              </button>
            </div>
          </div>

          {/* Sign in / Register tabs */}
          <div className="mb-7 grid grid-cols-2 border-b border-border">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                mode === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted'
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                mode === 'register'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
              {mode === 'login'
                ? 'Welcome back'
                : `Create your ${role} account`}
            </h2>

            <p className="mt-2 text-sm text-muted">
              {mode === 'login'
                ? `Sign in to access your ${role === 'provider' ? 'business workspace' : 'appointments and services'}.`
                : role === 'provider'
                  ? 'Set up your business profile and start managing bookings.'
                  : 'Join BookEase and discover services near you.'}
            </p>
          </div>

          {/* Feedback */}

          {logoutWarning && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-button border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
            >
              <TriangleAlert
                size={19}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="font-semibold">
                  Session security notice
                </p>

                <p className="mt-1 leading-relaxed">
                  {logoutWarning}
                </p>

                <button
                  type="button"
                  onClick={() => setLogoutWarning('')}
                  className="mt-2 text-xs font-medium underline underline-offset-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-button border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-button border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text">
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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
                        <span className="ml-1 font-normal text-muted">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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
                  <span className="ml-1 font-normal text-muted">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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

            {mode === 'login' && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  state={{ email: formData.email }}
                  className="text-sm font-medium text-primary transition hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Confirm password */}
            {mode === 'register' && (
              <div>
                <label className={labelClass}>
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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
              className="flex w-full items-center justify-center gap-2 rounded-button bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}

              {!loading && <ArrowRight size={17} />}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-muted">
            {role === 'provider'
              ? 'Manage your services and bookings with BookEase.'
              : 'Discover services and keep your appointments organised.'}
          </p>

          </div>
        </section>
      </div>
    </main>
  )
}

export default UnifiedAuth
