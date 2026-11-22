import {
  LayoutDashboard,
  CalendarDays,
  BriefcaseBusiness,
  Users,
  Settings,
  LogOut,
  Scissors,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { NavLink, useNavigate } from 'react-router-dom'
import { logoutUser } from '../../services/authService'

const navigation = [
  {
    label: 'OVERVIEW',
    items: [
      {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/provider/dashboard',
      },
      {
        name: 'Bookings',
        icon: CalendarDays,
        path: '/provider/bookings',
      },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      {
        name: 'Services',
        icon: BriefcaseBusiness,
        path: '/provider/services',
      },
      {
        name: 'Customers',
        icon: Users,
        path: '/provider/customers',
      },
    ],
  },
]

function Sidebar({
  isCollapsed = false,
  onToggleSidebar,
  isMobile = false,
  onClose,
}) {
  const navigate = useNavigate()

  const SidebarIcon = isCollapsed
    ? PanelLeftOpen
    : PanelLeftClose

  const toggleLabel = isCollapsed
    ? 'Expand sidebar'
    : 'Collapse sidebar'

  const handleLogout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  const getNavigationClass = ({ isActive }) => `
    flex min-h-11 w-full items-center rounded-button
    py-3 text-sm transition-colors
    ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'}
    ${
      isActive
        ? 'bg-primary-soft font-medium text-primary'
        : 'text-muted hover:bg-surface-muted hover:text-foreground'
    }
  `

  return (
    <aside
      id={isMobile ? "provider-mobile-sidebar" : "provider-sidebar"}
      className={`
        flex h-dvh shrink-0 flex-col
        overflow-x-hidden overflow-y-auto
        border-r border-border bg-surface py-6
        transition-[width,padding] duration-300 ease-in-out
        motion-reduce:transition-none
        ${isMobile
          ? 'w-full px-5'
          : `sticky top-0 ${isCollapsed ? 'w-20 px-3' : 'w-[250px] px-5'}`
        }
      `}
    >
      {/* Brand */}
      <NavLink
        to="/provider/dashboard"
        onClick={onClose}
        aria-label="BookEase dashboard"
        title={isCollapsed ? 'BookEase' : undefined}
        className={`
          mb-6 flex min-h-10 items-center
          ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}
        `}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-primary text-primary-foreground">
          <Scissors size={20} strokeWidth={1.8} />
        </div>

        {!isCollapsed && (
          <div className="whitespace-nowrap">
            <h1 className="font-heading text-lg font-bold tracking-tight text-foreground">
              BookEase
            </h1>

            <p className="text-xs text-muted">
              Provider workspace
            </p>
          </div>
        )}
      </NavLink>

      {isMobile ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="mb-8 flex min-h-11 w-full items-center gap-3 rounded-button border border-border bg-surface-muted px-3 py-3 text-sm text-muted hover:text-primary"
        >
          <X size={20} strokeWidth={1.8} />
          Close menu
        </button>
      ) : (
        <>
      {/* Sidebar collapse / expand toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={toggleLabel}
        aria-expanded={!isCollapsed}
        aria-controls="provider-sidebar"
        title={toggleLabel}
        className={`
          mb-8 flex min-h-11 w-full items-center
          rounded-button border border-border
          bg-surface-muted py-3 text-sm text-muted
          transition-colors hover:bg-primary-soft
          hover:text-primary
          ${isCollapsed
            ? 'justify-center px-2'
            : 'gap-3 px-3'}
        `}
      >
        <SidebarIcon
          size={20}
          strokeWidth={1.8}
          className="shrink-0"
          aria-hidden="true"
        />

        {!isCollapsed && (
          <span className="whitespace-nowrap">
            Collapse
          </span>
        )}
      </button>

        </>
      )}

      {/* Navigation */}
      <nav
        aria-label="Provider navigation"
        className="flex-1 space-y-8"
      >
        {navigation.map((section) => (
          <div key={section.label}>
            {isCollapsed ? (
              <div
                aria-hidden="true"
                className="mx-3 mb-3 border-t border-border"
              />
            ) : (
              <p className="mb-3 whitespace-nowrap px-3 text-[10px] font-semibold tracking-[0.12em] text-muted">
                {section.label}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    aria-label={item.name}
                    title={isCollapsed ? item.name : undefined}
                    className={getNavigationClass}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.8}
                      className="shrink-0"
                      aria-hidden="true"
                    />

                    {!isCollapsed && (
                      <span className="whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Account actions */}
      <div className="mt-6 space-y-1 border-t border-border pt-5">
        <NavLink
  to="/provider/profile"
  onClick={onClose}
  aria-label="My Profile"
  title={isCollapsed ? 'My Profile' : undefined}
  className={getNavigationClass}
>
  <UserRound
    size={20}
    strokeWidth={1.8}
    className="shrink-0"
    aria-hidden="true"
  />

  {!isCollapsed && (
    <span className="whitespace-nowrap">
      My Profile
    </span>
  )}
</NavLink>


<NavLink
  to="/provider/change-password"
  onClick={onClose}
  aria-label="Account Security"
  title={isCollapsed ? 'Account Security' : undefined}
  className={getNavigationClass}
>
  <ShieldCheck
    size={20}
    strokeWidth={1.8}
    className="shrink-0"
    aria-hidden="true"
  />

  {!isCollapsed && (
    <span className="whitespace-nowrap">
      Account Security
    </span>
  )}
</NavLink>

        <NavLink
          to="/provider/settings"
          onClick={onClose}
          aria-label="Settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={getNavigationClass}
        >
          <Settings
            size={20}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />

          {!isCollapsed && (
            <span className="whitespace-nowrap">
              Settings
            </span>
          )}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title={isCollapsed ? 'Sign out' : undefined}
          className={`
            flex min-h-11 w-full items-center
            rounded-button py-3 text-sm text-muted
            transition-colors hover:bg-danger-soft
            hover:text-danger-text
            ${isCollapsed
              ? 'justify-center px-2'
              : 'gap-3 px-3'}
          `}
        >
          <LogOut
            size={20}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />

          {!isCollapsed && (
            <span className="whitespace-nowrap">
              Sign out
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
