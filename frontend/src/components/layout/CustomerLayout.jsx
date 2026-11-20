
import { useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Scissors,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from 'lucide-react'

import {
  logoutUser,
} from '../../services/authService'

import { useSidebar } from '../../hooks/useSidebar'
import ThemeToggle from '../ui/ThemeToggle'
import AccountDropdown from '../ui/AccountDropdown'

const navigation = [
  {
    label: 'Overview',
    path: '/customer/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Bookings',
    path: '/customer/bookings',
    icon: CalendarDays,
  },
  {
    label: 'Book a Service',
    path: '/customer/book',
    icon: PlusCircle,
  },
  {
    label: 'My Profile',
    path: '/customer/profile',
    icon: UserRound,
  },
]

function CustomerSidebar({
  isCollapsed = false,
  isMobile = false,
  onToggle,
  onClose,
  onLogout,
}) {
  const compact = isCollapsed && !isMobile

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-y-auto border-r border-border bg-surface py-6 transition-[width] duration-300 ${
        compact ? 'w-20 px-3' : 'w-64 px-5'
      }`}
    >
      {/* Brand */}
      <Link
        to="/customer/dashboard"
        onClick={onClose}
        aria-label="BookEase customer dashboard"
        className={`flex items-center gap-3 ${
          compact ? 'justify-center' : 'px-2'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-primary text-primary-foreground">
          <Scissors size={20} />
        </div>

        {!compact && (
          <div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">
              BookEase
            </span>

            <p className="text-xs text-muted">
              Customer workspace
            </p>
          </div>
        )}
      </Link>

      {/* Sidebar controls */}
      <button
        type="button"
        onClick={isMobile ? onClose : onToggle}
        aria-label={
          isMobile
            ? 'Close menu'
            : compact
              ? 'Expand sidebar'
              : 'Collapse sidebar'
        }
        title={
          isMobile
            ? 'Close menu'
            : compact
              ? 'Expand sidebar'
              : 'Collapse sidebar'
        }
        className={`mt-6 flex min-h-11 items-center gap-3 rounded-button border border-border bg-surface-muted px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground ${
          compact ? 'justify-center' : ''
        }`}
      >
        {isMobile ? (
          <X size={19} aria-hidden="true" />
        ) : compact ? (
          <PanelLeftOpen size={19} aria-hidden="true" />
        ) : (
          <PanelLeftClose size={19} aria-hidden="true" />
        )}

        {!compact && (
          <span>
            {isMobile ? 'Close menu' : 'Collapse'}
          </span>
        )}
      </button>

      {/* Navigation */}
      <nav
        aria-label="Customer navigation"
        className="mt-8 flex flex-1 flex-col gap-2"
      >
        {compact ? (
          <div className="mx-auto mb-3 w-8 border-t border-border" />
        ) : (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Workspace
          </p>
        )}

        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={onClose}
              title={compact ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-3 rounded-button px-3 py-3 text-sm font-medium transition-colors ${
                  compact ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted hover:bg-surface-muted hover:text-foreground'
                }`
              }
            >
              <Icon
                size={19}
                strokeWidth={1.8}
                className="shrink-0"
                aria-hidden="true"
              />

              {!compact && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Account actions */}
      <div className="mt-6 border-t border-border pt-4">
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          aria-label="Sign out"
          className={`flex min-h-11 w-full items-center gap-3 rounded-button px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-danger-soft hover:text-danger-text ${
            compact ? 'justify-center' : ''
          }`}
        >
          <LogOut
            size={19}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          {!compact && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

function CustomerLayout({ children }) {
  const navigate = useNavigate()
  const menuButtonRef = useRef(null)
  const drawerRef = useRef(null)

  const {
    isCollapsed,
    isMobileOpen,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
  } = useSidebar()

  const handleLogout = () => {
    logoutUser()
    navigate('/customer/login', { replace: true })
  }

  // Manage mobile drawer scrolling and keyboard navigation.
  useEffect(() => {
    if (!isMobileOpen) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = menuButtonRef.current
    const drawer = drawerRef.current

    // Match Tailwind's lg breakpoint.
    const desktop = window.matchMedia('(min-width: 1024px)')

    document.body.style.overflow = 'hidden'

    drawer?.querySelector('button')?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileSidebar()
        return
      }

      if (event.key !== 'Tab' || !drawer) return

      const elements = drawer.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex="0"]'
      )

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleResize = (event) => {
      if (event.matches) closeMobileSidebar()
    }

    document.addEventListener('keydown', handleKeyDown)
    desktop.addEventListener('change', handleResize)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      desktop.removeEventListener('change', handleResize)
      previousFocus?.focus()
    }
  }, [isMobileOpen, closeMobileSidebar])

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">

      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <CustomerSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={closeMobileSidebar}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Navigation drawer */}
          <div
            id="customer-mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Customer navigation menu"
            className="relative h-dvh w-fit max-w-[85vw] shadow-elevated"
          >
            <CustomerSidebar
              isMobile
              onClose={closeMobileSidebar}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div
        inert={isMobileOpen ? true : undefined}
        className="flex min-w-0 flex-1 flex-col"
      >

        {/* Customer header */}
        <header className="flex min-h-[72px] items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={openMobileSidebar}
              aria-label="Open navigation menu"
              aria-expanded={isMobileOpen}
              aria-controls={
                isMobileOpen
                  ? 'customer-mobile-navigation'
                  : undefined
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-border text-foreground hover:bg-surface-muted lg:hidden"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>

            {/* Workspace label */}
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium tracking-wider text-muted sm:text-xs">
                BOOKEASE
                <span className="hidden lg:inline">
                  {' / CUSTOMER'}
                </span>
              </p>

              <p className="mt-1 truncate text-xs font-semibold text-foreground sm:text-sm">
                Customer workspace
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <AccountDropdown />
          </div>
        </header>

        {/* Customer page content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default CustomerLayout
