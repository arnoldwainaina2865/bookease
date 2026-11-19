
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/useTheme'

export default function ThemeToggle({
  showLabel = false,
  className = '',
}) {
  const { isDark, toggleTheme } = useTheme()

  const Icon = isDark ? Sun : Moon

  const label = isDark
    ? 'Switch to light mode'
    : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-button border border-border
        bg-surface text-foreground
        hover:bg-surface-muted hover:text-primary
        transition-colors duration-200
        ${showLabel ? 'px-3 py-2' : 'h-10 w-10'}
        ${className}
      `}
    >
      <Icon
        size={19}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      {showLabel && (
        <span className="text-sm font-medium">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  )
}
