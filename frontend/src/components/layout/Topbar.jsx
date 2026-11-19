import { Menu } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'
import AccountDropdown from '../ui/AccountDropdown'

function Topbar({ onOpenMobileSidebar }) {
  return (
    <header className="flex min-h-[72px] items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3 sm:px-6 lg:px-8">

      {/* Workspace information */}
      <div className="flex min-w-0 items-center gap-3">

        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
          aria-haspopup="dialog"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted lg:hidden"
        >
          <Menu size={21} strokeWidth={1.8} />
        </button>



        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wider text-muted">
            BOOKEASE
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            Business workspace
          </p>
        </div>

      </div>

      {/* Header actions */}
      <div className="flex shrink-0 items-center gap-3">

        {/* Theme switch */}
        <ThemeToggle />

        <AccountDropdown />
      </div>
    </header>
  )
}

export default Topbar
