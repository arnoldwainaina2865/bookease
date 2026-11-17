
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Scissors,
  LogOut,
} from 'lucide-react'

import { getCurrentUser, logoutUser } from "../../services/authService";

function CustomerLayout({ children }) {
  const user = getCurrentUser()
  const location = useLocation()
  const navigate = useNavigate()

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
  ]

  const handleLogout = () => {
    logoutUser()
    navigate('/customer/login')
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#202421] lg:flex">

      {/* Sidebar */}
      <aside className="w-full border-b border-[#E7E8E4] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">

        {/* Brand */}
        <Link
          to="/customer/dashboard"
          className="flex items-center gap-3 border-b border-[#E7E8E4] px-6 py-5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#647D68] text-white">
            <Scissors size={20} />
          </div>

          <span className="text-xl font-semibold tracking-tight">
            BookEase
          </span>
        </Link>

        {/* Customer information */}
        <div className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#929890]">
            Customer workspace
          </p>

          <p className="mt-2 font-semibold">
            {user?.full_name || 'Customer'}
          </p>

          <p className="mt-1 text-xs text-[#929890]">
            Manage your appointments
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-1 lg:flex-col lg:overflow-visible">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#EDF2ED] text-[#526A56]'
                    : 'text-[#777D76] hover:bg-[#F7F7F5] hover:text-[#202421]'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-[#E7E8E4] p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#777D76] transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main page content */}
      <main className="min-w-0 flex-1">
        {children}
      </main>

    </div>
  )
}

export default CustomerLayout
