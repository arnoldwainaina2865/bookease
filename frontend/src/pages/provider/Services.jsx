import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'


import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Power,
  Clock3,
  BriefcaseBusiness,
  X,
  LoaderCircle,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'

import {
  getProviderServices,
  createProviderService,
  updateProviderService,
  deactivateProviderService,
} from '../../services/serviceService'

const initialForm = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '30',
}

function formatCurrency(amount) {
  return `KSh ${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function Services() {
  const { confirm, dialogProps } = useConfirm()

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const servicesRequestRef = useRef(0)

  useEffect(() => {
    if (!modalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) {
        event.preventDefault()
        setModalOpen(false)
        setEditingService(null)
        setForm(initialForm)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen, saving])

  const fetchServices = useCallback(() => {
    const requestId = ++servicesRequestRef.current

    return getProviderServices()
      .then((data) => {
        if (requestId !== servicesRequestRef.current) return

        setServices(data.services || [])
      })
      .catch((err) => {
        if (requestId !== servicesRequestRef.current) return

        setError(
          err.response?.data?.message ||
          'Unable to retrieve your services.'
        )
      })
      .finally(() => {
        if (requestId === servicesRequestRef.current) {
          setLoading(false)
        }
      })
  }, [])

  useEffect(() => {
    fetchServices()

    return () => {
      servicesRequestRef.current += 1
    }
  }, [fetchServices])

  const refreshServices = () => {
    setLoading(true)
    setError('')

    return fetchServices()
  }

  const openCreateModal = () => {
    setEditingService(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const openEditModal = (service) => {
    setEditingService(service)

    setForm({
      name: service.name,
      description: service.description || '',
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
    })

    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingService(null)
    setForm(initialForm)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const price = Number(form.price)
    const duration = Number(form.duration_minutes)

    if (!form.name.trim()) {
      setError('Please enter a service name.')
      return
    }

    if (form.name.trim().length > 150) {
      setError('Service name cannot exceed 150 characters.')
      return
    }

    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid non-negative service price.')
      return
    }

    if (
      form.duration_minutes.trim() === '' ||
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      setError('Duration must be a positive whole number of minutes.')
      return
    }

    const serviceData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      duration_minutes: duration,
    }

    setSaving(true)

    try {
      if (editingService) {
        await updateProviderService(editingService.id, serviceData)
        setSuccess('Service updated successfully.')
      } else {
        await createProviderService(serviceData)
        setSuccess('Service created successfully.')
      }

      setModalOpen(false)
      setEditingService(null)
      setForm(initialForm)

      await refreshServices()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save this service. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (service) => {
    const confirmed = await confirm({
      title: 'Deactivate service?',
      message: `Are you sure you want to deactivate "${service.name}"? Customers will no longer be able to book this service while it is inactive.`,
      confirmLabel: 'Deactivate service',
      cancelLabel: 'Keep service active',
      destructive: true,
    })

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await deactivateProviderService(service.id)
      setSuccess(`${service.name} has been deactivated.`)
      await refreshServices()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to deactivate this service.'
      )
    }
  }

  const handleActivate = async (service) => {
    setError('')
    setSuccess('')

    try {
      await updateProviderService(service.id, {
        is_active: true,
      })

      setSuccess(`${service.name} has been activated.`)
      await refreshServices()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to activate this service.'
      )
    }
  }

  const filteredServices = services.filter((service) => {
    const query = search.toLowerCase()

    return (
      service.name.toLowerCase().includes(query) ||
      (service.description || '').toLowerCase().includes(query)
    )
  })

  const activeCount = services.filter(
    (service) => service.is_active
  ).length

  const inactiveCount = services.length - activeCount

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Services
            </h1>

            <p className="mt-1 text-sm text-muted">
              Manage the services your business offers.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus size={17} />
            Add service
          </button>
        </div>

        {/* Feedback */}
        {error && !modalOpen && (
          <div className="rounded-button border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-button border border-border bg-primary-soft px-4 py-3 text-sm text-primary">
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="min-w-0 rounded-card border border-border bg-surface p-3 sm:p-5">
            <p className="text-xs leading-relaxed text-muted sm:text-sm">Total services</p>
            <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl text-foreground">
              {services.length}
            </p>
          </div>

          <div className="min-w-0 rounded-card border border-border bg-surface p-3 sm:p-5">
            <p className="text-xs leading-relaxed text-muted sm:text-sm">Active services</p>
            <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl text-primary">
              {activeCount}
            </p>
          </div>

          <div className="min-w-0 rounded-card border border-border bg-surface p-3 sm:p-5">
            <p className="text-xs leading-relaxed text-muted sm:text-sm">Inactive services</p>
            <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl text-muted">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Services table */}
        <section className="overflow-hidden rounded-card border border-border bg-surface">

          <div className="flex flex-col justify-between gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Your services
              </h2>

              <p className="mt-1 text-xs text-muted">
                Manage pricing, duration and availability.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-button border border-border px-3">
              <Search size={17} className="text-muted" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search services..."
                aria-label="Search services"
                className="bg-surface text-foreground placeholder:text-muted w-full py-2.5 text-sm outline-none sm:w-52"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
              <LoaderCircle size={19} className="animate-spin" />
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-card bg-surface-muted text-primary">
                <BriefcaseBusiness size={22} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {services.length === 0
                  ? 'No services yet'
                  : 'No matching services'}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-muted">
                {services.length === 0
                  ? 'Add your first service to start managing what your business offers.'
                  : 'Try searching with a different service name.'}
              </p>

              {services.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  <Plus size={16} />
                  Add your first service
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile service cards */}
              <div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
                {filteredServices.map((service) => (
                  <article
                    key={service.id}
                    className="flex min-w-0 flex-col rounded-card border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">
                        {service.name}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          service.is_active
                            ? 'bg-primary-soft text-primary'
                            : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="mt-2 break-words text-sm leading-relaxed text-muted">
                      {service.description || 'No description provided'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(service.price)}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Clock3 size={15} aria-hidden="true" />
                        {service.duration_minutes} min
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          aria-label={`Edit ${service.name}`}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-button border border-border px-2 py-2.5 text-xs font-medium text-primary hover:bg-primary-soft"
                        >
                          <Pencil size={15} aria-hidden="true" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            service.is_active
                              ? handleDeactivate(service)
                              : handleActivate(service)
                          }
                          aria-label={`${service.is_active ? 'Deactivate' : 'Activate'} ${service.name}`}
                          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-button px-2 py-2.5 text-xs font-medium transition-colors ${
                            service.is_active
                              ? 'bg-danger-soft text-danger-text'
                              : 'bg-primary-soft text-primary'
                          }`}
                        >
                          <Power size={15} aria-hidden="true" />
                          {service.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop services table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[750px] text-left">
                <thead className="bg-surface-muted">
                  <tr>
                    {['Service', 'Price', 'Duration', 'Status', 'Actions'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-xs font-semibold text-muted"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      className="transition-colors hover:bg-surface-muted"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">
                          {service.name}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-muted">
                          {service.description || 'No description provided'}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {formatCurrency(service.price)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Clock3 size={15} />
                          {service.duration_minutes} min
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            service.is_active
                              ? 'bg-primary-soft text-primary'
                              : 'bg-surface-muted text-muted'
                          }`}
                        >
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(service)}
                            title="Edit service"
                            className="rounded-button border border-border p-2 text-muted transition-colors hover:bg-surface-muted hover:text-primary"
                          >
                            <Pencil size={15} />
                          </button>

                          {service.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(service)}
                              title="Deactivate service"
                              className="rounded-button border border-border p-2 text-muted transition-colors hover:bg-danger-soft hover:text-danger-text"
                            >
                              <Power size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(service)}
                              title="Activate service"
                              className="rounded-button border border-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
          >

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
              <div>
                <h2 id="service-modal-title" className="text-lg font-semibold text-foreground">
                  {editingService ? 'Edit service' : 'Add a service'}
                </h2>

                <p className="mt-1 text-xs text-muted">
                  Enter the details of your service below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close service form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-border text-muted hover:bg-surface-muted disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">

              {error && (
                <div className="rounded-button border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="service-name" className="mb-2 block text-sm font-medium text-foreground">
                  Service name
                </label>

                <input
                  id="service-name" name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Haircut"
                  maxLength={150}
                  required
                  className="bg-surface text-foreground placeholder:text-muted w-full rounded-button border border-border px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="service-description" className="mb-2 block text-sm font-medium text-foreground">
                  Description
                  <span className="ml-1 font-normal text-muted">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="service-description" name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe what this service includes..."
                  className="bg-surface text-foreground placeholder:text-muted w-full resize-none rounded-button border border-border px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="service-price" className="mb-2 block text-sm font-medium text-foreground">
                    Price (KSh)
                  </label>

                  <input
                    type="number"
                    id="service-price" name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="500"
                    required
                    className="bg-surface text-foreground placeholder:text-muted w-full rounded-button border border-border px-3 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="service-duration_minutes" className="mb-2 block text-sm font-medium text-foreground">
                    Duration (minutes)
                  </label>

                  <input
                    type="number"
                    id="service-duration_minutes" name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    className="bg-surface text-foreground placeholder:text-muted w-full rounded-button border border-border px-3 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-border bg-surface px-4 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-button border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingService
                      ? 'Save changes'
                      : 'Create service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    <ConfirmDialog {...dialogProps} />
    </DashboardLayout>
  )
}

export default Services
