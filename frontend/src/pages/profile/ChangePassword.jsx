
import { useState } from 'react'
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  LockKeyhole,
} from 'lucide-react'

import { changeMyPassword } from '../../services/profileService'

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function ChangePassword() {
  const [form, setForm] = useState(initialForm)
  const [visible, setVisible] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fields = [
    {
      name: 'currentPassword',
      label: 'Current password',
      autoComplete: 'current-password',
    },
    {
      name: 'newPassword',
      label: 'New password',
      autoComplete: 'new-password',
    },
    {
      name: 'confirmPassword',
      label: 'Confirm new password',
      autoComplete: 'new-password',
    },
  ]

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) return

    setError('')
    setSuccess('')

    if (Object.values(form).some((value) => !value)) {
      setError('Please complete all password fields.')
      return
    }

    if (form.newPassword.length < 8 || form.newPassword.length > 72) {
      setError('Your new password must contain 8 to 72 characters.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    if (form.currentPassword === form.newPassword) {
      setError('Your new password must be different from your current password.')
      return
    }

    setLoading(true)

    try {
      const response = await changeMyPassword(
        form.currentPassword,
        form.newPassword
      )

      setForm(initialForm)
      setVisible({})

      setSuccess(
        response.message || 'Password updated successfully.'
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update your password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
          <KeyRound size={17} />
          Account security
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Change password
        </h1>

        <p className="mt-2 text-sm text-muted">
          Update your password to keep your BookEase account secure.
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-button bg-primary-soft text-primary">
            <LockKeyhole size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-foreground">
              Password settings
            </h2>

            <p className="text-sm text-muted">
              Enter your current password to make changes.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-button border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-button border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-2 block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>

              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type={visible[field.name] ? 'text' : 'password'}
                  value={form[field.name]}
                  onChange={handleChange}
                  autoComplete={field.autoComplete}
                  disabled={loading}
                  required
                  className="w-full rounded-button border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setVisible((previous) => ({
                      ...previous,
                      [field.name]: !previous[field.name],
                    }))
                  }
                  disabled={loading}
                  aria-label={
                    visible[field.name]
                      ? `Hide ${field.label.toLowerCase()}`
                      : `Show ${field.label.toLowerCase()}`
                  }
                  className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-foreground"
                >
                  {visible[field.name] ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted">
            Your new password must contain 8 to 72 characters
            and must be different from your current password.
          </p>

          <div className="flex justify-end border-t border-border pt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <KeyRound size={17} />
              )}

              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword
