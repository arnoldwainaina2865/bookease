import PublicHeader from '../public/PublicHeader'
import PublicFooter from '../public/PublicFooter'

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-button focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <PublicHeader />

      <main id="main-content">
        {children}
      </main>

      <PublicFooter />
    </div>
  )
}
