
import { getCurrentUser } from '../../services/authService'

function Topbar() {
  const user = getCurrentUser()

  const fullName = user?.full_name || 'Provider'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <header className="flex min-h-[68px] items-center justify-between border-b border-[#E7E8E4] bg-white px-8">
      <div>
        <p className="text-xs font-medium text-[#999E98]">
          BOOKEASE / PROVIDER
        </p>

        <p className="mt-1 text-sm font-medium text-[#202421]">
          Business workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2ED] text-sm font-semibold text-[#526D57]">
          {initials || 'P'}
        </div>

        <div className="hidden sm:block">
          <p className="text-sm font-medium text-[#202421]">
            {fullName}
          </p>

          <p className="text-xs text-[#999E98]">
            {user?.email || 'Provider account'}
          </p>
        </div>
      </div>
    </header>
  )
}

export default Topbar
