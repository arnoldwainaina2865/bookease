import { Link } from 'react-router-dom'
import { Scissors, ArrowUpRight } from 'lucide-react'

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 pb-6 pt-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Scissors size={23} />
              </div>
              <span className="font-heading text-xl font-extrabold">
                BookEase.
              </span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-muted">
              Connecting people with local businesses through
              simple, convenient appointment booking.
            </p>

            <p className="mt-4 text-sm font-medium text-primary">
              Your time. Your choice.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-5 flex flex-col gap-4 text-sm text-muted">
              <a href="/#home">Home</a>
              <a href="/services">Services</a>
              <a href="/#how-it-works">How it works</a>
              <a href="/#about">About us</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">For businesses</h3>
            <div className="mt-5 flex flex-col gap-4 text-sm text-muted">
              <Link to="/register?role=provider">
                Become a provider
              </Link>
              <Link to="/login?role=provider">
                Provider sign in
              </Link>
              <a href="/#business">Business solutions</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Support</h3>
            <div className="mt-5 flex flex-col gap-4 text-sm text-muted">
              <a href="/#faq">Frequently asked questions</a>
              <Link to="/forgot-password">Account recovery</Link>
              <Link to="/login">My account</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} BookEase.
            All rights reserved.
          </p>

          <a
            href="/#home"
            className="inline-flex items-center gap-2 font-medium hover:text-primary"
          >
            Back to top
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </footer>
  )
}
