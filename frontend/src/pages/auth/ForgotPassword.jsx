import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Mail,
  MailCheck,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react'

import RecoveryLayout from '../../components/layout/RecoveryLayout'
import { requestPasswordReset } from '../../services/authService'

function ForgotPassword() {
  const location = useLocation()

  const [email, setEmail] = useState(
    location.state?.email || ''
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      await requestPasswordReset(email.trim())
      setSubmitted(true)
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please try again later.'
          : err.response?.data?.message ||
            'Unable to process your request. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <RecoveryLayout
      title={submitted ? 'Check your inbox' : 'Forgot password?'}
      description={
        submitted
          ? 'If an eligible account exists for this email, you will receive password reset instructions.'
          : 'Enter the email address associated with your account and we will send you a secure password reset link.'
      }
      icon={submitted ? MailCheck : Mail}
    >

      {submitted ? (
        <div className="space-y-5">

          <div
            role="status"
            className="rounded-card border border-success/30 bg-success-soft p-5 text-sm text-success-text"
          >
            <p className="font-semibold">
              Recovery request received
            </p>

            <p className="mt-2 break-all">
              {email.trim()}
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface-muted p-5 text-sm leading-relaxed text-muted">
            <p className="mb-2 font-semibold text-foreground">
              What happens next?
            </p>

            <p>Check your inbox and spam folder.</p>

            <p className="mt-2">
              Your recovery link expires after 30 minutes
              and can only be used once.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false)
              setError('')
            }}
            className="w-full rounded-button border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface-muted"
          >
            Try another email or resend
          </button>

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
              htmlFor="recovery-email"
              className="mb-2 block text-sm font-medium"
            >
              Email address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                required
                disabled={loading}
                className="w-full rounded-input border border-border bg-surface py-3.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-button bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Sending request...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="text-center text-xs leading-relaxed text-muted">
            For your security, we do not disclose whether
            an email address is registered with BookEase.
          </p>

        </form>
      )}

    </RecoveryLayout>
  )
}

export default ForgotPassword
