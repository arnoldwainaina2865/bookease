import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Menu, X, ArrowUpRight } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'
import {
  getCurrentUser,
  isAuthenticated,
} from '../../services/authService'

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'About', href: '/#about' },
  { label: 'FAQ', href: '/#faq' },
]

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const user = getCurrentUser()
  const authenticated = isAuthenticated() &&
    ['customer', 'provider'].includes(user?.role)

  const dashboard = authenticated
    ? `/${user.role}/dashboard`
    : '/login'

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-2xl shadow-sm transition-colors duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">

        <Link
          to="/"
          aria-label="BookEase homepage"
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scissors size={23} strokeWidth={1.7} />
          </div>

          <span className="font-heading text-xl font-extrabold tracking-tight">
            BookEase<span className="text-primary">.</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            to={dashboard}
            className="hidden text-sm font-semibold sm:block"
          >
            {authenticated ? 'Dashboard' : 'Sign in'}
          </Link>

          {!authenticated && (
            <Link
              to="/register"
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover lg:flex"
            >
              Get started
              <ArrowUpRight size={16} />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            className="rounded-button border border-border p-2.5 lg:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="public-mobile-menu"
          aria-label="Mobile navigation"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMenuOpen(false)
          }}
          className="space-y-2 border-t border-border bg-surface p-5 lg:hidden"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-button px-4 py-3 text-sm font-medium hover:bg-surface-muted"
            >
              {item.label}
            </a>
          ))}

          <Link
            to={dashboard}
            onClick={() => setMenuOpen(false)}
            className="block rounded-button border border-border px-4 py-3 text-center text-sm font-semibold"
          >
            {authenticated ? 'Dashboard' : 'Sign in'}
          </Link>

          {!authenticated && (
            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
              className="block rounded-button bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Create account
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
