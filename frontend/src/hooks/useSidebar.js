import { useState, useEffect } from 'react'

const STORAGE_KEY = 'bookease-sidebar-collapsed'

function getInitialSidebarState() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(
    getInitialSidebarState
  )

  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        String(isCollapsed)
      )
    } catch {
      // Keep the sidebar functional if storage is unavailable.
    }
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed((previous) => !previous)
  }

  const expandSidebar = () => {
    setIsCollapsed(false)
  }

  const collapseSidebar = () => {
    setIsCollapsed(true)
  }

  const openMobileSidebar = () => {
    setIsMobileOpen(true)
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggleSidebar,
    expandSidebar,
    collapseSidebar,
    openMobileSidebar,
    closeMobileSidebar,
  }
}
