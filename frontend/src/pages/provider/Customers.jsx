
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Mail,
  Phone,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserRound,
  X,
  Clock,
  Banknote,
  AlertCircle,
  Eye,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import {
  getProviderCustomers,
  getProviderCustomerDetails,
} from '../../services/customerService'

function formatDate(value) {
  if (!value) return 'Unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable'
  }

  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return 'Unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable'
  }

  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCurrency(value) {
  const amount = Number(value || 0)

  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getInitials(name) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'C'
  )
}

function getStatusClasses(status) {
  const styles = {
    completed: 'bg-primary-soft text-primary',
    confirmed: 'bg-primary-soft text-primary',
    pending: 'bg-warning-soft text-warning-text',
    cancelled: 'bg-surface-muted text-muted',
    rejected: 'bg-danger-soft text-danger-text',
  }

  return styles[status?.toLowerCase()] || 'bg-surface-muted text-muted'
}

function formatStatus(status) {
  if (!status) return 'Unknown'

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function CustomerProfileDrawer({
  customer,
  details,
  loading,
  error,
  onClose,
  onRetry,
  onViewBooking,
}) {
  if (!customer) return null

  const profile = details?.customer
  const statistics = details?.statistics
  const bookings = details?.bookings || []

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-profile-title"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface shadow-elevated"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Customer directory
            </p>
            <h2
              id="customer-profile-title"
              className="mt-1 text-lg font-semibold text-foreground"
            >
              Customer profile
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer profile"
            className="flex h-9 w-9 items-center justify-center rounded-button text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X size={19} />
          </button>
        </div>

        {/* Drawer content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw
                size={25}
                className="animate-spin text-primary"
              />
              <p className="mt-4 text-sm text-muted">
                Loading customer profile...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-card border border-danger/30 bg-danger-soft p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-danger-text">
                <AlertCircle size={18} />
                Unable to load customer profile
              </div>

              <p className="mt-2 text-sm text-danger-text">
                {error}
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-button border border-danger/30 bg-surface px-4 py-2 text-sm font-medium text-danger-text hover:bg-danger-soft"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && details && (
            <>
              {/* Customer identity */}
              <section>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
                    {getInitials(profile?.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {profile?.full_name}
                    </h3>

                    <p className="mt-1 text-sm text-muted">
                      Customer #{profile?.id}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        profile?.is_active
                          ? 'bg-primary-soft text-primary'
                          : 'bg-surface-muted text-muted'
                      }`}
                    >
                      {profile?.is_active ? 'Active account' : 'Inactive account'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Contact information */}
              <section className="rounded-card border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Contact information
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail size={17} className="shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Email address</p>
                      <p className="break-all text-sm text-foreground">
                        {profile?.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={17} className="shrink-0 text-muted" />
                    <div>
                      <p className="text-xs text-muted">Phone number</p>
                      <p className="text-sm text-foreground">
                        {profile?.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays
                      size={17}
                      className="shrink-0 text-muted"
                    />
                    <div>
                      <p className="text-xs text-muted">Customer since</p>
                      <p className="text-sm text-foreground">
                        {formatDate(profile?.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Customer statistics */}

{/* Customer statistics */}
<section>
  <h3 className="mb-3 text-sm font-semibold text-foreground">
    Booking overview
  </h3>

  <div className="grid grid-cols-2 gap-3">
    <div className="rounded-card border border-border p-4">
      <p className="text-xs text-muted">Total bookings</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {statistics?.total_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-card border border-border p-4">
      <p className="text-xs text-muted">Pending</p>
      <p className="mt-2 text-2xl font-semibold text-warning-text">
        {statistics?.pending_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-card border border-border p-4">
      <p className="text-xs text-muted">Confirmed</p>
      <p className="mt-2 text-2xl font-semibold text-primary">
        {statistics?.confirmed_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-card border border-border p-4">
      <p className="text-xs text-muted">Completed</p>
      <p className="mt-2 text-2xl font-semibold text-primary">
        {statistics?.completed_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-card border border-border p-4">
      <p className="text-xs text-muted">Cancelled</p>
      <p className="mt-2 text-2xl font-semibold text-muted">
        {statistics?.cancelled_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-card border border-border p-4">
      <p className="text-xs text-muted">Rejected</p>
      <p className="mt-2 text-2xl font-semibold text-danger-text">
        {statistics?.rejected_bookings ?? 0}
      </p>
    </div>

    <div className="col-span-2 rounded-card border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Total completed spend</p>
        <Banknote size={17} className="text-primary" />
      </div>
      <p className="mt-2 text-xl font-semibold text-primary">
        {formatCurrency(statistics?.total_completed_spend)}
      </p>
    </div>
  </div>
</section>

              {/* Booking history */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Booking history
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {bookings.length} recorded bookings
                    </p>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="rounded-card border border-dashed border-border py-10 text-center">
                    <CalendarDays
                      size={23}
                      className="mx-auto text-muted"
                    />
                    <p className="mt-3 text-sm text-muted">
                      No booking history available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-card border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {booking.service?.name || 'Service'}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              Booking #{booking.id}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(booking.status)}`}
                          >
                            {formatStatus(booking.status)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <p className="flex items-center gap-2 text-xs text-muted">
                            <CalendarDays size={14} />
                            {formatDateTime(booking.start_at)}
                          </p>

                          <p className="flex items-center gap-2 text-xs text-muted">
                            <Clock size={14} />
                            {booking.service?.duration_minutes
                              ? `${booking.service.duration_minutes} minutes`
                              : 'Duration unavailable'}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                          <span className="text-xs text-muted">
                            Booking amount
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(booking.total_price)}
                          </span>
                        </div>

                                                <button
                          type="button"
                          onClick={() => onViewBooking(booking.id)}
                          className="mt-4 inline-flex items-center gap-2 rounded-button border border-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary-soft"
                        >
                          <Eye size={14} />
                          View booking
                        </button>

                        {booking.customer_notes && (
                          <div className="mt-3 rounded-button bg-surface-muted p-3">
                            <p className="text-xs font-medium text-muted">
                              Customer notes
                            </p>
                            <p className="mt-1 text-xs leading-5 text-foreground">
                              {booking.customer_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])

  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total_customers: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  })

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Customer profile drawer state.
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetails, setCustomerDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0)

  // Retrieve customers.
  useEffect(() => {
    let isMounted = true

    const timeout = setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const data = await getProviderCustomers({
          page: pagination.page,
          per_page: pagination.per_page,
          search,
        })

        if (!isMounted) return

        setCustomers(data.customers || [])
        setPagination((current) => ({
          ...current,
          ...data.pagination,
        }))
      } catch (err) {
        if (!isMounted) return

        setError(
          err.response?.data?.message ||
          'Unable to retrieve customers. Please try again.'
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }, search ? 300 : 0)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [pagination.page, pagination.per_page, search, refreshKey])

  // Retrieve the selected customer's profile and booking history.
  const selectedCustomerId = selectedCustomer?.id

  useEffect(() => {
    if (!selectedCustomerId) return

    let active = true

    getProviderCustomerDetails(selectedCustomerId)
      .then((data) => {
        if (!active) return

        setCustomerDetails(data)
      })
      .catch((err) => {
        if (!active) return

        setDetailsError(
          err.response?.data?.message ||
          'Unable to retrieve this customer profile.'
        )
      })
      .finally(() => {
        if (active) {
          setDetailsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedCustomerId, detailsRefreshKey])

  // Open the customer profile drawer.
  const handleOpenProfile = (customer) => {
    setCustomerDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    setSelectedCustomer(customer)
    setDetailsRefreshKey((current) => current + 1)
  }

  const handleSearch = (event) => {
    setSearch(event.target.value)

    setPagination((current) => ({
      ...current,
      page: 1,
    }))
  }

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1)
  }

  const changePage = (newPage) => {
    setPagination((current) => ({
      ...current,
      page: newPage,
    }))
  }

  const handleCloseProfile = () => {
    setSelectedCustomer(null)
    setCustomerDetails(null)
    setDetailsError('')
    setDetailsLoading(false)
  }

  const handleRetryDetails = () => {
    if (!selectedCustomer) return

    setCustomerDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    setDetailsRefreshKey((current) => current + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Customers
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage and view customers who have booked your services.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-button border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {/* Customer summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">
                  Total customers
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {pagination.total_customers}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-button bg-primary-soft text-primary">
                <Users size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">
              Customers who have booked your services
            </p>
          </div>
        </div>

        {/* Customer directory */}
        <section className="overflow-hidden rounded-card border border-border bg-surface">

          <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Customer directory
              </h2>
              <p className="mt-1 text-sm text-muted">
                Customer details and booking activity.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search customers..."
                className="w-full rounded-button border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-button border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
              {error}
            </div>
          )}

          {/* Mobile customer cards */}
          <div className="space-y-3 p-3 sm:p-5 xl:hidden">

            {loading && (
              <div className="py-12 text-center text-sm text-muted">
                <RefreshCw
                  size={22}
                  className="mx-auto mb-3 animate-spin text-primary"
                />
                Loading customers...
              </div>
            )}

            {!loading && !error && customers.length === 0 && (
              <div className="py-12 text-center">
                <UserRound
                  size={26}
                  className="mx-auto text-muted"
                />

                <p className="mt-3 text-sm font-medium text-foreground">
                  No customers found
                </p>

                <p className="mt-2 text-xs text-muted">
                  {search
                    ? 'Try another name, email, or phone number.'
                    : 'Customers will appear here when they book your services.'}
                </p>
              </div>
            )}

            {!loading && !error && customers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                {/* Customer identity */}
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {getInitials(customer.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-semibold text-foreground">
                      {customer.full_name}
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Customer #{customer.id}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      customer.is_active
                        ? 'bg-primary-soft text-primary'
                        : 'bg-surface-muted text-muted'
                    }`}
                  >
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Contact information */}
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Mail
                      size={15}
                      className="shrink-0 text-muted"
                    />
                    <p className="min-w-0 break-all text-sm text-foreground">
                      {customer.email || 'No email address'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone
                      size={15}
                      className="shrink-0 text-muted"
                    />
                    <p className="text-sm text-muted">
                      {customer.phone || 'No phone number'}
                    </p>
                  </div>
                </div>

                {/* Booking statistics */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-button bg-surface-muted p-3">
                    <p className="text-xs text-muted">
                      Total bookings
                    </p>

                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {customer.total_bookings ?? 0}
                    </p>
                  </div>

                  <div className="rounded-button bg-surface-muted p-3">
                    <p className="text-xs text-muted">
                      Last booking
                    </p>

                    <p className="mt-2 text-xs font-semibold text-foreground">
                      {formatDate(customer.last_booking_at)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenProfile(customer)}
                  aria-label={`View profile for ${customer.full_name}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-button bg-primary-soft px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
                >
                  <Eye size={16} />
                  View profile
                </button>
              </article>
            ))}
          </div>

          {/* Desktop customer table */}
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Total bookings
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Last booking
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Account
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {loading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-sm text-muted"
                    >
                      <RefreshCw
                        size={20}
                        className="mx-auto mb-3 animate-spin text-primary"
                      />
                      Loading customers...
                    </td>
                  </tr>
                )}

                {!loading && !error && customers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted">
                        <UserRound size={22} />
                      </div>

                      <p className="mt-4 text-sm font-medium text-foreground">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        {search
                          ? 'Try another name, email, or phone number.'
                          : 'Customers will appear here when they book your services.'}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading && !error && customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-surface-muted"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                          {getInitials(customer.full_name)}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {customer.full_name}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Customer #{customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2 text-sm text-foreground">
                          <Mail size={14} className="text-muted" />
                          {customer.email}
                        </p>

                        <p className="flex items-center gap-2 text-xs text-muted">
                          <Phone size={13} className="text-muted" />
                          {customer.phone || 'No phone number'}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                        {customer.total_bookings} bookings
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        <CalendarDays
                          size={15}
                          className="text-muted"
                        />
                        {formatDate(customer.last_booking_at)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          customer.is_active
                            ? 'bg-primary-soft text-primary'
                            : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(customer)}
                        className="inline-flex items-center gap-2 rounded-button border border-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary-soft"
                      >
                        <Eye size={14} />
                        View profile
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col justify-between gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-muted">
              Showing{' '}
              {customers.length > 0
                ? (pagination.page - 1) * pagination.per_page + 1
                : 0}
              {' '}to{' '}
              {(pagination.page - 1) * pagination.per_page + customers.length}
              {' '}of {pagination.total_customers} customers
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.has_previous || loading}
                className="inline-flex items-center gap-1 rounded-button border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-muted">
                {pagination.page} / {pagination.total_pages || 1}
              </span>

              <button
                type="button"
                onClick={() => changePage(pagination.page + 1)}
                disabled={!pagination.has_next || loading}
                className="inline-flex items-center gap-1 rounded-button border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </section>
      </div>

      {/* Customer profile drawer */}
            <CustomerProfileDrawer
        customer={selectedCustomer}
        details={customerDetails}
        loading={detailsLoading}
        error={detailsError}
        onClose={handleCloseProfile}
        onRetry={handleRetryDetails}
        onViewBooking={(bookingId) => {
          navigate('/provider/bookings', {
            state: {
              focusBookingId: bookingId,
            },
          })
        }}
      />
    </DashboardLayout>
  )
}

export default Customers
