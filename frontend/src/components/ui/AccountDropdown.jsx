
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ChevronDown,
  UserRound,
  Settings,
  LockKeyhole,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'

import {
  getCurrentUser,
  logoutUser,
} from '../../services/authService'

import {
  getMyProfile,
  getMyAvatarBlob,
} from '../../services/profileService'

import { useTheme } from '../../context/useTheme'

function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(() => getCurrentUser())
  const [avatarUrl, setAvatarUrl] = useState(null)

  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const avatarUrlRef = useRef(null)
  const requestIdRef = useRef(0)
  const dropdownId = useId()

  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const isProvider = user?.role === 'provider'
  const accountType = isProvider ? 'Provider' : 'Customer'
  const fullName = user?.full_name || accountType

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || accountType[0]

  const profilePath = isProvider
    ? '/provider/profile'
    : '/customer/profile'

  const replaceAvatar = (nextUrl) => {
    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current)
    }

    avatarUrlRef.current = nextUrl
    setAvatarUrl(nextUrl)
  }

  useEffect(() => {
    let active = true

    const refreshAccount = async () => {
      const requestId = ++requestIdRef.current
      const cachedUser = getCurrentUser()

      if (!cachedUser) {
        if (active) {
          setUser(null)
          replaceAvatar(null)
        }
        return
      }

      setUser(cachedUser)

      try {
        const response = await getMyProfile()

        if (!active || requestId !== requestIdRef.current) {
          return
        }

        const updatedUser = response.user

        if (!updatedUser) return

        setUser(updatedUser)

        localStorage.setItem(
          'user',
          JSON.stringify({
            ...cachedUser,
            ...updatedUser,
          })
        )

        if (!updatedUser.avatar_url) {
          replaceAvatar(null)
          return
        }

        const blob = await getMyAvatarBlob()

        if (!active || requestId !== requestIdRef.current) {
          return
        }

        replaceAvatar(URL.createObjectURL(blob))
      } catch {
        // Keep cached account information if refreshing fails.
      }
    }

    refreshAccount()

    const handleProfileUpdated = () => {
      refreshAccount()
    }

    window.addEventListener(
      'bookease:profile-updated',
      handleProfileUpdated
    )

    return () => {
      active = false
      requestIdRef.current += 1

      window.removeEventListener(
        'bookease:profile-updated',
        handleProfileUpdated
      )

      if (avatarUrlRef.current) {
        URL.revokeObjectURL(avatarUrlRef.current)
        avatarUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const closeDropdown = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleProfileNavigation = () => {
    setIsOpen(false)
    navigate(profilePath)
  }

  const handleLogout = () => {
    setIsOpen(false)
    logoutUser()
    navigate('/login', { replace: true })
  }

  const handleThemeChange = () => {
    toggleTheme()
    closeDropdown()
  }

  const accountLinks = [
    {
      label: 'Account settings',
      icon: Settings,
    },
    {
      label: 'Security',
      icon: LockKeyhole,
    },
  ]

  const avatar = (sizeClass) => (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  )

  return (
    <div
      ref={dropdownRef}
      className="relative border-l border-border pl-2 sm:pl-3"
    >
      {/* Account trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label="Account options"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dropdownId : undefined}
        className="flex items-center gap-3 rounded-button text-left transition-colors hover:bg-surface-muted sm:p-1.5"
      >
        {avatar('h-10 w-10 text-sm')}

        <div className="hidden md:block">
          <p className="max-w-[160px] truncate text-sm font-semibold text-foreground">
            {fullName}
          </p>

          <p className="max-w-[160px] truncate text-xs text-muted">
            {user?.email || `${accountType} account`}
          </p>
        </div>

        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`hidden text-muted transition-transform md:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          id={dropdownId}
          role="region"
          aria-label="Account menu"
          className="absolute right-0 top-full z-40 mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-border bg-surface text-foreground shadow-elevated"
        >
          {/* Account identity */}
          <div className="border-b border-border p-4">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
              My account
            </p>

            <div className="flex items-center gap-3">
              {avatar('h-12 w-12 text-sm')}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {fullName}
                </p>

                <p className="mt-1 truncate text-xs text-muted">
                  {user?.email || `${accountType} account`}
                </p>

                <span className="mt-2 inline-block rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-medium text-primary">
                  {accountType} account
                </span>
              </div>
            </div>
          </div>

          {/* Account navigation */}
          <div className="space-y-1 p-2">
            <button
              type="button"
              onClick={handleProfileNavigation}
              className="flex min-h-11 w-full items-center gap-3 rounded-button px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <UserRound
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span className="flex-1">
                My profile
              </span>
            </button>

            {accountLinks.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex min-h-11 w-full cursor-not-allowed items-center gap-3 rounded-button px-3 py-2.5 text-left text-sm text-muted opacity-60"
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  <span className="text-[10px]">
                    Soon
                  </span>
                </button>
              )
            })}

            {/* Appearance */}
            <button
              type="button"
              onClick={handleThemeChange}
              className="flex min-h-11 w-full items-center gap-3 rounded-button px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {isDark ? (
                <Sun size={18} aria-hidden="true" />
              ) : (
                <Moon size={18} aria-hidden="true" />
              )}

              <span>
                {isDark ? 'Light appearance' : 'Dark appearance'}
              </span>
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium text-danger-text transition-colors hover:bg-danger-soft"
            >
              <LogOut
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountDropdown
