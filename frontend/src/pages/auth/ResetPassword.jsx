import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

import RecoveryLayout from '../../components/layout/RecoveryLayout'

import {
  resetUserPassword,
  logoutUser,
} from '../../services/authService'

const inputClass =
  'w-full rounded-input border border-border bg-surface py-3.5 pl-10 pr-12 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft'

function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()

  const [token] = useState(() =>
    new URLSearchParams(location.search).get('token') || ''
  )

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token)

  const minimumLength = Array.from(password).length >= 8
  const validByteLength =
    new TextEncoder().encode(password).length <= 72

  const passwordsMatch =
    password.length > 0 && password === confirmPassword

  // Remove the sensitive recovery token from the address bar.
  useEffect(() => {
    if (location.search) {
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) return

    setError('')

    if (!validToken) {
      setError('This password reset link is invalid.')
      return
    }

    if (!minimumLength || !validByteLength) {
      setError(
        'Password must contain at least 8 characters and must not exceed 72 bytes.'
      )
      return
    }

    if (!passwordsMatch) {
      setError('Your passwords do not match.')
      return
    }

    const previousSession = localStorage.getItem('access_token')

    setLoading(true)

    try {
      await resetUserPassword(token, password)

      setPassword('')
      setConfirmPassword('')

      // Avoid clearing a different session created during the request.
      if (
        localStorage.getItem('access_token') === previousSession
      ) {
        logoutUser()
      }

      navigate('/login', {
        replace: true,
        state: {
          successMessage:
            'Password reset successfully. Please sign in with your new password.',
        },
      })
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many attempts. Please try again later.'
          : err.response?.data?.message ||
            'Unable to reset your password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <RecoveryLayout
      title="Create a new password"
      description="Choose a secure password to regain access to your BookEase account."
      icon={LockKeyhole}
    >

      {!validToken ? (
        <div className="space-y-5">

          <div
            role="alert"
            className="rounded-card border border-danger/30 bg-danger-soft p-5 text-sm text-danger-text"
          >
            <p className="font-semibold">
              Invalid or missing recovery link
            </p>

            <p className="mt-2">
              Please request a new password reset link
              to continue.
            </p>
          </div>

          <Link
            to="/forgot-password"
            className="flex w-full items-center justify-center gap-2 rounded-button bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground"
          >
            Request a new link
            <ArrowRight size={17} />
          </Link>

        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {error && (
            <div
              role="alert"
              className="rounded-button border border-danger/30 bg-danger-soft p-4 text-sm text-danger-text"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium"
            >
              New password
            </label>

            <div className="relative">

              <LockKeyhole
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your new password"
                disabled={loading}
                required
                className={inputClass}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium"
            >
              Confirm password
            </label>

            <div className="relative">

              <LockKeyhole
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                disabled={loading}
                required
                className={inputClass}
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

            </div>
          </div>

          <div className="space-y-2 rounded-card border border-border bg-surface-muted p-4 text-xs">

            {[
              [minimumLength, 'At least 8 characters'],
              [validByteLength, 'No more than 72 bytes'],
              [passwordsMatch, 'Passwords match'],
            ].map(([valid, label]) => (
              <div
                key={label}
                className={`flex items-center gap-2 ${
                  valid ? 'text-success-text' : 'text-muted'
                }`}
              >
                <span aria-hidden="true">
                  {valid ? '✓' : '○'}
                </span>
                {label}
              </div>
            ))}

          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !minimumLength ||
              !validByteLength ||
              !passwordsMatch
            }
            className="flex w-full items-center justify-center gap-2 rounded-button bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Resetting password...
              </>
            ) : (
              <>
                Reset password
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck size={18} className="shrink-0" />

            <p>
              Resetting your password will sign out all
              existing sessions for the recovered account.
            </p>
          </div>

          <Link
            to="/forgot-password"
            className="block text-center text-sm font-medium text-primary hover:underline"
          >
            Request a new recovery link
          </Link>

        </form>
      )}

    </RecoveryLayout>
  )
}

export default ResetPassword
