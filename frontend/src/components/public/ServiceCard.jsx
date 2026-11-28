import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  MapPin,
  Store,
} from 'lucide-react'

import {
  getCurrentUser,
  isAuthenticated,
} from '../../services/authService'

export default function ServiceCard({ service }) {
  const provider = service.provider
  const user = getCurrentUser()
  const authenticated = isAuthenticated()

  const bookingUrl = `/customer/book?serviceId=${service.id}`

  const destination = authenticated && user?.role === 'customer'
    ? bookingUrl
    : `/login?role=customer&serviceId=${service.id}`

  const providerAccount =
    authenticated && user?.role === 'provider'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-surface shadow-sm transition duration-300 hover:shadow-lg">

      <div className="flex items-center gap-4 border-b border-border bg-surface-muted p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Store size={23} strokeWidth={1.6} />
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {provider.business_name}
            {provider.is_verified && (
              <BadgeCheck
                size={18}
                className="shrink-0 text-primary"
                aria-label="Verified provider"
              />
            )}
          </p>

          <p className="mt-1 text-xs text-muted">
            {provider.category}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-heading text-xl font-bold tracking-tight">
          {service.name}
        </h2>

        <p className="mt-3 flex-1 text-sm leading-7 text-muted">
          {service.description || 'Contact the provider for more information.'}
        </p>

        <div className="mt-5 space-y-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <MapPin size={17} className="shrink-0" />
            {provider.location}
          </div>

          <div className="flex items-center gap-2">
            <Clock3 size={17} />
            {service.duration_minutes} minutes
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs text-muted">Service price</p>

          <p className="mt-1 font-heading text-2xl font-bold text-primary">
            KSh {Number(service.price).toLocaleString('en-KE')}
          </p>

          {providerAccount ? (
            <p className="mt-4 rounded-xl bg-surface-muted p-3 text-center text-xs text-muted">
              Sign in as a customer to book.
            </p>
          ) : (
            <Link
              to={destination}
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Book appointment
              <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
