import { Link } from 'react-router-dom'
import { Scissors, ArrowLeft, ShieldCheck } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'

function RecoveryLayout({
  title,
  description,
  icon: RecoveryIcon,
  children,
}) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center bg-[#142B20] px-4 py-10 sm:px-8">

      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/auth-background.png')",
        }}
      />

      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-black/50"
      />

      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#C9A66B]/40 shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">

        <aside className="hidden flex-col justify-between bg-[#142B20]/95 p-12 text-[#F5EFE5] lg:flex">

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A66B]/50 text-[#D7BA85]">
              <Scissors size={27} strokeWidth={1.5} />
            </div>

            <span className="font-serif text-4xl">
              BookEase
            </span>
          </div>

          <div className="py-16">
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-[#D7BA85]">
              Account security
            </p>

            <div className="mb-8 h-px w-20 bg-[#C9A66B]" />

            <h2 className="font-serif text-5xl leading-tight">
              Your account.
              <span className="block italic text-[#D7BA85]">
                Your peace of mind.
              </span>
            </h2>

            <p className="mt-6 text-sm leading-relaxed text-[#D1DDD4]">
              Securely recover access to your BookEase
              account and get back to what matters.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-[#C9A66B]/25 pt-6 text-sm text-[#D7BA85]">
            <ShieldCheck size={20} />
            Secure account recovery
          </div>

        </aside>

        <div className="bg-surface/95 p-6 text-foreground backdrop-blur-md sm:p-10 lg:p-12">

          <div className="mb-10 flex items-center justify-between">

            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-button bg-primary text-primary-foreground">
                <Scissors size={20} />
              </div>

              <span className="font-serif text-2xl">
                BookEase
              </span>
            </div>

            <span className="hidden text-xs uppercase tracking-widest text-muted lg:block">
              Account recovery
            </span>

            <ThemeToggle />

          </div>

          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-card bg-primary-soft text-primary">
            <RecoveryIcon size={26} strokeWidth={1.7} />
          </div>

          <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {title}
          </h1>

          <p className="mb-8 mt-3 text-sm leading-relaxed text-muted">
            {description}
          </p>

          {children}

          <Link
            to="/login"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>

        </div>
      </section>
    </main>
  )
}

export default RecoveryLayout
