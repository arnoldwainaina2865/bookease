import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  SearchX,
  RefreshCw,
} from 'lucide-react'

import PublicLayout from '../../components/layout/PublicLayout'
import ServiceCard from '../../components/public/ServiceCard'
import { getPublicServices } from '../../services/marketplaceService'

function MarketplaceResults({ search, location, category, page }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const controller = new AbortController()

    getPublicServices({
      search,
      location,
      category,
      page,
      perPage: 12,
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) setResult(data)
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.message ||
            'Unable to load services. Please try again.'
          )
        }
      })

    return () => controller.abort()
  }, [search, location, category, page, retry])

  function changePage(nextPage) {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
  }

  if (error) {
    return (
      <div role="alert" className="rounded-card border border-border bg-surface p-12 text-center">
        <p className="font-semibold text-danger-text">{error}</p>
        <button
          onClick={() => {
            setError('')
            setResult(null)
            setRetry((value) => value + 1)
          }}
          className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground"
        >
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    )
  }

  if (!result) {
    return (
      <div role="status" aria-label="Loading services" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-80 rounded-[24px] border border-border bg-surface-muted motion-safe:animate-pulse"
          />
        ))}
      </div>
    )
  }

  const services = result.services || []
  const pagination = result.pagination

  return (
    <>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">
            Available services
          </h2>
          <p role="status" className="mt-1 text-sm text-muted">
            {pagination.total_services} services found
          </p>
        </div>

        <SlidersHorizontal size={21} className="text-muted" />
      </div>

      {services.length === 0 ? (
        <div className="rounded-[24px] border border-border bg-surface px-6 py-16 text-center">
          <SearchX size={42} className="mx-auto text-muted" />
          <h3 className="mt-5 text-xl font-bold">
            No services found
          </h3>
          <p className="mt-3 text-sm text-muted">
            Try another service, category or location.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {(pagination.total_pages > 1 || page > 1) && (
        <nav aria-label="Results pagination" className="mt-10 flex items-center justify-center gap-5">
          <button
            disabled={!pagination.has_previous}
            onClick={() => changePage(page - 1)}
            className="rounded-xl border border-border p-3 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm text-muted">
            Page {page} of {pagination.total_pages || 1}
          </span>

          <button
            disabled={!pagination.has_next}
            onClick={() => changePage(page + 1)}
            className="rounded-xl border border-border p-3 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </nav>
      )}
    </>
  )
}

function SearchForm({ search, location, category }) {
  const [, setParams] = useSearchParams()

  function handleSearch(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()

    for (const name of ['search', 'location', 'category']) {
      const value = String(data.get(name) || '').trim()
      if (value) next.set(name, value)
    }

    setParams(next)
  }

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground'

  return (
    <form
      onSubmit={handleSearch}
      className="mt-9 grid gap-4 rounded-[24px] border border-border bg-surface p-5 shadow-sm lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end"
    >
      <label className="space-y-2">
        <span className="flex items-center gap-2 text-xs font-semibold">
          <Search size={15} /> Service or business
        </span>
        <input
          name="search"
          defaultValue={search}
          placeholder="e.g. Haircut"
          className={inputClass}
        />
      </label>

      <label className="space-y-2">
        <span className="flex items-center gap-2 text-xs font-semibold">
          <MapPin size={15} /> Location
        </span>
        <input
          name="location"
          defaultValue={location}
          placeholder="e.g. Westlands"
          className={inputClass}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold">Category</span>
        <input
          name="category"
          defaultValue={category}
          placeholder="All categories"
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        <Search size={18} />
        Search
      </button>
    </form>
  )
}

export default function Marketplace() {
  const [params] = useSearchParams()

  const search = params.get('search') || ''
  const location = params.get('location') || ''
  const category = params.get('category') || ''

  const requestedPage = Number(params.get('page') || 1)
  const page = Number.isSafeInteger(requestedPage)
    ? Math.max(1, requestedPage)
    : 1

  const filterKey = JSON.stringify([search, location, category])

  return (
    <PublicLayout>
      <section className="border-b border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            The BookEase marketplace
          </p>

          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
            Discover your next experience.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            Explore local businesses and find services that fit
            your lifestyle, schedule and budget.
          </p>

          <SearchForm
            key={filterKey}
            search={search}
            location={location}
            category={category}
          />
        </div>
      </section>

      <section className="mx-auto min-h-[50vh] max-w-7xl px-5 py-14 lg:px-8">
        <MarketplaceResults
          key={`${filterKey}:${page}`}
          search={search}
          location={location}
          category={category}
          page={page}
        />
      </section>
    </PublicLayout>
  )
}
