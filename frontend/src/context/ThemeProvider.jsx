
import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContext'

const THEME_STORAGE_KEY = 'bookease-theme'

// Retrieve the previously saved theme
function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  } catch {
    // Fall back to light mode if storage is unavailable
  }

  return 'light'
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  // Update the document and persist the selected theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Theme switching still works without local storage
    }
  }, [theme])

  // Switch between light and dark modes
  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light'
    )
  }

  // Allow components to explicitly select a theme
  function changeTheme(newTheme) {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme)
    }
  }

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: changeTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
