import { useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebar } from '../../hooks/useSidebar'

function DashboardLayout({ children }) {
  const {
    isCollapsed,
    toggleSidebar,
    isMobileOpen,
    openMobileSidebar,
    closeMobileSidebar,
  } = useSidebar()

  const drawerRef = useRef(null)

  useEffect(() => {
    const drawer = drawerRef.current

    if (isMobileOpen && drawer && !drawer.open) {
      drawer.showModal()
    }

    if (!isMobileOpen && drawer?.open) {
      drawer.close()
    }
  }, [isMobileOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')

    const handleResize = (event) => {
      if (event.matches) {
        drawerRef.current?.close()
      }
    }

    desktop.addEventListener('change', handleResize)

    return () => {
      desktop.removeEventListener('change', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!isMobileOpen) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileOpen])

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      {/* Desktop navigation */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
        />
      </div>

      {/* Mobile navigation drawer */}
      <dialog
        ref={drawerRef}
        aria-label="Provider navigation menu"
        onClose={closeMobileSidebar}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeMobileSidebar()
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-[280px] max-w-[85vw] border-0 bg-surface p-0 text-foreground shadow-elevated backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <Sidebar
          isMobile
          isCollapsed={false}
          onClose={closeMobileSidebar}
        />
      </dialog>

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar
          onOpenMobileSidebar={openMobileSidebar}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout
