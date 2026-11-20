
import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react'

import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  removeMyAvatar,
  getMyAvatarBlob,
} from '../../services/profileService'

import { getCurrentUser } from '../../services/authService'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024

function Profile() {
  const fileInputRef = useRef(null)
  const avatarUrlRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
  })

  const [avatarUrl, setAvatarUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const setAvatarPreview = (url) => {
    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current)
    }

    avatarUrlRef.current = url
    setAvatarUrl(url)
  }

  const loadAvatar = async (user) => {
    if (!user?.avatar_url) {
      setAvatarPreview(null)
      return
    }

    try {
      const blob = await getMyAvatarBlob()
      setAvatarPreview(URL.createObjectURL(blob))
    } catch (err) {
      setAvatarPreview(null)

      if (err.response?.status !== 404) {
        setError('Unable to load your profile picture.')
      }
    }
  }

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const response = await getMyProfile()
        if (!active) return

        const user = response.user

        setProfile(user)
        setForm({
          full_name: user.full_name || '',
          phone: user.phone || '',
        })

        if (user.avatar_url) {
          const blob = await getMyAvatarBlob()

          if (!active) return

          setAvatarPreview(URL.createObjectURL(blob))
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Unable to load your profile.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false

      if (avatarUrlRef.current) {
        URL.revokeObjectURL(avatarUrlRef.current)
        avatarUrlRef.current = null
      }
    }
  }, [])

  
const updateCachedUser = (user) => {
  const cachedUser = getCurrentUser() || {}

  localStorage.setItem(
    'user',
    JSON.stringify({
      ...cachedUser,
      ...user,
    })
  )

  // Notify the account dropdown that the profile changed.
  window.dispatchEvent(
    new Event('bookease:profile-updated')
  )
}


  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await updateMyProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
      })

      setProfile(response.user)
      updateCachedUser(response.user)
      setSuccess('Your profile has been updated.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    event.target.value = ''

    setError('')
    setSuccess('')

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Profile pictures must not exceed 5 MB.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }

    setAvatarBusy(true)

    try {
      const response = await uploadMyAvatar(file)

      setProfile(response.user)
      updateCachedUser(response.user)

      await loadAvatar(response.user)

      setSuccess('Your profile picture has been updated.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to upload your profile picture.'
      )
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setError('')
    setSuccess('')
    setAvatarBusy(true)

    try {
      const response = await removeMyAvatar()

      setProfile(response.user)
      updateCachedUser(response.user)
      setAvatarPreview(null)

      setSuccess('Your profile picture has been removed.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to remove your profile picture.'
      )
    } finally {
      setAvatarBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        <LoaderCircle className="mr-3 animate-spin" size={20} />
        Loading your profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div
        role="alert"
        className="rounded-card border border-border bg-surface p-6 text-danger-text"
      >
        {error || 'Your profile could not be loaded.'}
      </div>
    )
  }

  const initials = profile.full_name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          Account settings
        </p>

        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          My profile
        </h1>

        <p className="mt-2 text-sm text-muted">
          Manage your personal information and profile picture.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-button border border-danger-text/20 bg-danger-soft px-4 py-3 text-sm text-danger-text"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-button border border-border bg-primary-soft px-4 py-3 text-sm text-primary"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-3xl font-semibold text-primary">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your profile"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Profile picture
            </h2>

            <p className="mt-1 text-sm text-muted">
              JPEG, PNG, or WebP. Maximum 5 MB.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Choose profile picture"
              />

              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {avatarBusy ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Camera size={17} />
                )}

                {avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>

              {profile.avatar_url && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={handleRemoveAvatar}
                  className="inline-flex min-h-11 items-center gap-2 rounded-button border border-border px-4 py-2 text-sm font-medium text-danger-text hover:bg-danger-soft disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-button bg-primary-soft text-primary">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Personal information
            </h2>

            <p className="text-sm text-muted">
              Keep your contact details up to date.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Full name
              </span>

              <input
                type="text"
                required
                maxLength={120}
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    full_name: event.target.value,
                  }))
                }
                className="min-h-11 w-full rounded-button border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Phone number
              </span>

              <input
                type="tel"
                maxLength={20}
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="min-h-11 w-full rounded-button border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Email address
              </span>

              <input
                type="email"
                value={profile.email || ''}
                readOnly
                className="min-h-11 w-full cursor-not-allowed rounded-button border border-border bg-surface-muted px-4 py-3 text-sm text-muted"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Account type
              </span>

              <input
                type="text"
                value={
                  profile.role === 'provider'
                    ? 'Service provider'
                    : 'Customer'
                }
                readOnly
                className="min-h-11 w-full cursor-not-allowed rounded-button border border-border bg-surface-muted px-4 py-3 text-sm text-muted"
              />
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-6">
            <button
              type="submit"
              disabled={saving || avatarBusy}
              className="inline-flex min-h-11 items-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Profile
