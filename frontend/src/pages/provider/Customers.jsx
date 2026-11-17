
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
  CalendarCheck,
  CheckCircle2,
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
    completed: 'bg-[#EEF2ED] text-[#526D57]',
    confirmed: 'bg-[#EEF2ED] text-[#526D57]',
    pending: 'bg-[#F8F3E8] text-[#92733D]',
    cancelled: 'bg-[#F3F3F1] text-[#777D76]',
    rejected: 'bg-[#F8EEEE] text-[#A35F5F]',
  }

  return styles[status?.toLowerCase()] || 'bg-[#F3F3F1] text-[#777D76]'
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
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[#E7E8E4] px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#999E98]">
              Customer directory
            </p>
            <h2
              id="customer-profile-title"
              className="mt-1 text-lg font-semibold text-[#202421]"
            >
              Customer profile
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777D76] transition-colors hover:bg-[#F3F4F1] hover:text-[#202421]"
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
                className="animate-spin text-[#647D68]"
              />
              <p className="mt-4 text-sm text-[#777D76]">
                Loading customer profile...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertCircle size={18} />
                Unable to load customer profile
              </div>

              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
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
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EEF2ED] text-lg font-semibold text-[#526D57]">
                    {getInitials(profile?.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-[#202421]">
                      {profile?.full_name}
                    </h3>

                    <p className="mt-1 text-sm text-[#777D76]">
                      Customer #{profile?.id}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        profile?.is_active
                          ? 'bg-[#EEF2ED] text-[#526D57]'
                          : 'bg-[#F3F3F1] text-[#777D76]'
                      }`}
                    >
                      {profile?.is_active ? 'Active account' : 'Inactive account'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Contact information */}
              <section className="rounded-xl border border-[#E7E8E4] p-5">
                <h3 className="text-sm font-semibold text-[#202421]">
                  Contact information
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail size={17} className="shrink-0 text-[#8A9188]" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#999E98]">Email address</p>
                      <p className="break-all text-sm text-[#202421]">
                        {profile?.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={17} className="shrink-0 text-[#8A9188]" />
                    <div>
                      <p className="text-xs text-[#999E98]">Phone number</p>
                      <p className="text-sm text-[#202421]">
                        {profile?.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays
                      size={17}
                      className="shrink-0 text-[#8A9188]"
                    />
                    <div>
                      <p className="text-xs text-[#999E98]">Customer since</p>
                      <p className="text-sm text-[#202421]">
                        {formatDate(profile?.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Customer statistics */}
              
{/* Customer statistics */}
<section>
  <h3 className="mb-3 text-sm font-semibold text-[#202421]">
    Booking overview
  </h3>

  <div className="grid grid-cols-2 gap-3">
    <div className="rounded-xl border border-[#E7E8E4] p-4">
      <p className="text-xs text-[#777D76]">Total bookings</p>
      <p className="mt-2 text-2xl font-semibold text-[#202421]">
        {statistics?.total_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-[#E7E8E4] p-4">
      <p className="text-xs text-[#777D76]">Pending</p>
      <p className="mt-2 text-2xl font-semibold text-[#92733D]">
        {statistics?.pending_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-[#E7E8E4] p-4">
      <p className="text-xs text-[#777D76]">Confirmed</p>
      <p className="mt-2 text-2xl font-semibold text-[#526D57]">
        {statistics?.confirmed_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-[#E7E8E4] p-4">
      <p className="text-xs text-[#777D76]">Completed</p>
      <p className="mt-2 text-2xl font-semibold text-[#526D57]">
        {statistics?.completed_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-[#E7E8E4] p-4">
      <p className="text-xs text-[#777D76]">Cancelled</p>
      <p className="mt-2 text-2xl font-semibold text-[#777D76]">
        {statistics?.cancelled_bookings ?? 0}
      </p>
    </div>

    <div className="rounded-xl border border-[#E7E8E4] p-4">
      <p className="text-xs text-[#777D76]">Rejected</p>
      <p className="mt-2 text-2xl font-semibold text-[#A35F5F]">
        {statistics?.rejected_bookings ?? 0}
      </p>
    </div>

    <div className="col-span-2 rounded-xl border border-[#E7E8E4] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#777D76]">Total completed spend</p>
        <Banknote size={17} className="text-[#647D68]" />
      </div>
      <p className="mt-2 text-xl font-semibold text-[#526D57]">
        {formatCurrency(statistics?.total_completed_spend)}
      </p>
    </div>
  </div>
</section>

              {/* Booking history */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#202421]">
                      Booking history
                    </h3>
                    <p className="mt-1 text-xs text-[#999E98]">
                      {bookings.length} recorded bookings
                    </p>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E7E8E4] py-10 text-center">
                    <CalendarDays
                      size={23}
                      className="mx-auto text-[#999E98]"
                    />
                    <p className="mt-3 text-sm text-[#777D76]">
                      No booking history available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-xl border border-[#E7E8E4] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#202421]">
                              {booking.service?.name || 'Service'}
                            </p>
                            <p className="mt-1 text-xs text-[#999E98]">
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
                          <p className="flex items-center gap-2 text-xs text-[#777D76]">
                            <CalendarDays size={14} />
                            {formatDateTime(booking.start_at)}
                          </p>

                          <p className="flex items-center gap-2 text-xs text-[#777D76]">
                            <Clock size={14} />
                            {booking.service?.duration_minutes
                              ? `${booking.service.duration_minutes} minutes`
                              : 'Duration unavailable'}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#E7E8E4] pt-3">
                          <span className="text-xs text-[#999E98]">
                            Booking amount
                          </span>
                          <span className="text-sm font-semibold text-[#202421]">
                            {formatCurrency(booking.total_price)}
                          </span>
                        </div>

                                                <button
                          type="button"
                          onClick={() => onViewBooking(booking.id)}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E7E8E4] px-3 py-2 text-xs font-medium text-[#526D57] transition-colors hover:border-[#647D68] hover:bg-[#EEF2ED]"
                        >
                          <Eye size={14} />
                          View booking
                        </button>

                        {booking.customer_notes && (
                          <div className="mt-3 rounded-lg bg-[#FAFAF8] p-3">
                            <p className="text-xs font-medium text-[#777D76]">
                              Customer notes
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#555D55]">
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
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerDetails(null)
      setDetailsError('')
      return
    }

    let isMounted = true

    const fetchDetails = async () => {
      setDetailsLoading(true)
      setDetailsError('')
      setCustomerDetails(null)

      try {
        const data = await getProviderCustomerDetails(selectedCustomer.id)

        if (!isMounted) return

        setCustomerDetails(data)
      } catch (err) {
        if (!isMounted) return

        setDetailsError(
          err.response?.data?.message ||
          'Unable to retrieve this customer profile.'
        )
      } finally {
        if (isMounted) {
          setDetailsLoading(false)
        }
      }
    }

    fetchDetails()

    return () => {
      isMounted = false
    }
  }, [selectedCustomer])

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
  }

  const handleRetryDetails = () => {
    if (!selectedCustomer) return

    // Trigger a new request by changing the selected customer reference.
    setSelectedCustomer((current) => ({ ...current }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#202421]">
              Customers
            </h1>
            <p className="mt-1 text-sm text-[#777D76]">
              Manage and view customers who have booked your services.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E7E8E4] bg-white px-4 py-2.5 text-sm font-medium text-[#526D57] transition-colors hover:bg-[#F7F7F5] disabled:opacity-50"
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
          <div className="rounded-xl border border-[#E7E8E4] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#777D76]">
                  Total customers
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#202421]">
                  {pagination.total_customers}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2ED] text-[#647D68]">
                <Users size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-[#999E98]">
              Customers who have booked your services
            </p>
          </div>
        </div>

        {/* Customer directory */}
        <section className="overflow-hidden rounded-xl border border-[#E7E8E4] bg-white">

          <div className="flex flex-col justify-between gap-4 border-b border-[#E7E8E4] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-[#202421]">
                Customer directory
              </h2>
              <p className="mt-1 text-sm text-[#777D76]">
                Customer details and booking activity.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999E98]"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search customers..."
                className="w-full rounded-lg border border-[#E7E8E4] bg-white py-2.5 pl-10 pr-4 text-sm text-[#202421] outline-none transition-colors placeholder:text-[#A4A9A2] focus:border-[#647D68]"
              />
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#FAFAF8]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#777D76]">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#777D76]">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#777D76]">
                    Total bookings
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#777D76]">
                    Last booking
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#777D76]">
                    Account
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#777D76]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E7E8E4]">

                {loading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-sm text-[#777D76]"
                    >
                      <RefreshCw
                        size={20}
                        className="mx-auto mb-3 animate-spin text-[#647D68]"
                      />
                      Loading customers...
                    </td>
                  </tr>
                )}

                {!loading && !error && customers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F1] text-[#8A9188]">
                        <UserRound size={22} />
                      </div>

                      <p className="mt-4 text-sm font-medium text-[#202421]">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-[#777D76]">
                        {search
                          ? 'Try another name, email, or phone number.'
                          : 'Customers will appear here when they book your services.'}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading && customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-[#FAFAF8]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2ED] text-sm font-semibold text-[#526D57]">
                          {getInitials(customer.full_name)}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-[#202421]">
                            {customer.full_name}
                          </p>
                          <p className="mt-1 text-xs text-[#999E98]">
                            Customer #{customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2 text-sm text-[#555D55]">
                          <Mail size={14} className="text-[#999E98]" />
                          {customer.email}
                        </p>

                        <p className="flex items-center gap-2 text-xs text-[#777D76]">
                          <Phone size={13} className="text-[#999E98]" />
                          {customer.phone || 'No phone number'}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#EEF2ED] px-3 py-1 text-xs font-medium text-[#526D57]">
                        {customer.total_bookings} bookings
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="flex items-center gap-2 text-sm text-[#555D55]">
                        <CalendarDays
                          size={15}
                          className="text-[#999E98]"
                        />
                        {formatDate(customer.last_booking_at)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          customer.is_active
                            ? 'bg-[#EEF2ED] text-[#526D57]'
                            : 'bg-[#F3F3F1] text-[#777D76]'
                        }`}
                      >
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#E7E8E4] px-3 py-2 text-xs font-medium text-[#526D57] transition-colors hover:border-[#647D68] hover:bg-[#EEF2ED]"
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
          <div className="flex flex-col justify-between gap-4 border-t border-[#E7E8E4] px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-[#777D76]">
              Showing{' '}
              {customers.length > 0
                ? (pagination.page - 1) * pagination.per_page + 1
                : 0}
              {' '}to{' '}
              {(pagination.page - 1) * pagination.per_page + customers.length}
              {' '}of {pagination.total_customers} customers
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.has_previous || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E7E8E4] px-3 py-2 text-sm text-[#555D55] transition-colors hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-[#777D76]">
                {pagination.page} / {pagination.total_pages || 1}
              </span>

              <button
                type="button"
                onClick={() => changePage(pagination.page + 1)}
                disabled={!pagination.has_next || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E7E8E4] px-3 py-2 text-sm text-[#555D55] transition-colors hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-40"
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
