import { useState, useEffect, useCallback } from 'react'

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

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((previous) => !previous)
  }, [])

  const expandSidebar = useCallback(() => {
    setIsCollapsed(false)
  }, [])

  const collapseSidebar = useCallback(() => {
    setIsCollapsed(true)
  }, [])

  const openMobileSidebar = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

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
