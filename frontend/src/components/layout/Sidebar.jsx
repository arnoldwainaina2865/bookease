
import {
  LayoutDashboard,
  CalendarDays,
  BriefcaseBusiness,
  Users,
  Settings,
  LogOut,
  Scissors,
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

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-screen w-[250px] shrink-0 flex-col border-r border-[#E7E8E4] bg-white px-5 py-6">

      {/* Brand */}
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#647D68] text-white">
          <Scissors size={19} />
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#202421]">
            BookEase
          </h1>
          <p className="text-xs text-[#777D76]">
            Provider workspace
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-8">
        {navigation.map((section) => (
          <div key={section.label}>
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.12em] text-[#999E98]">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon

                if (!item.path) {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      disabled
                      title="Coming soon"
                      className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#B0B4AE] opacity-70"
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      <span>{item.name}</span>
                    </button>
                  )
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#EEF2ED] font-medium text-[#526D57]'
                          : 'text-[#777D76] hover:bg-[#F7F7F5] hover:text-[#202421]'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Account actions */}
      <div className="space-y-1 border-t border-[#E7E8E4] pt-5">
        
<NavLink
  to="/provider/settings"
  className={({ isActive }) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? 'bg-[#EEF2ED] font-medium text-[#526D57]'
        : 'text-[#777D76] hover:bg-[#F7F7F5] hover:text-[#202421]'
    }`
  }
>
  <Settings size={18} strokeWidth={1.8} />
  <span>Settings</span>
</NavLink>


        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#777D76] transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
