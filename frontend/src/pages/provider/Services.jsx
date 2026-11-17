
import { useEffect, useState } from 'react'
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
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const fetchServices = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getProviderServices()
      setServices(data.services || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to retrieve your services.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

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

      await fetchServices()
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
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${service.name}"?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await deactivateProviderService(service.id)
      setSuccess(`${service.name} has been deactivated.`)
      await fetchServices()
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
      await fetchServices()
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
            <h1 className="text-2xl font-semibold tracking-tight text-[#202421]">
              Services
            </h1>

            <p className="mt-1 text-sm text-[#777D76]">
              Manage the services your business offers.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#647D68] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#526D57]"
          >
            <Plus size={17} />
            Add service
          </button>
        </div>

        {/* Feedback */}
        {error && !modalOpen && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-[#DCE6DC] bg-[#F0F5F0] px-4 py-3 text-sm text-[#526D57]">
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E7E8E4] bg-white p-5">
            <p className="text-sm text-[#777D76]">Total services</p>
            <p className="mt-2 text-2xl font-semibold text-[#202421]">
              {services.length}
            </p>
          </div>

          <div className="rounded-xl border border-[#E7E8E4] bg-white p-5">
            <p className="text-sm text-[#777D76]">Active services</p>
            <p className="mt-2 text-2xl font-semibold text-[#526D57]">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-[#E7E8E4] bg-white p-5">
            <p className="text-sm text-[#777D76]">Inactive services</p>
            <p className="mt-2 text-2xl font-semibold text-[#777D76]">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Services table */}
        <section className="overflow-hidden rounded-xl border border-[#E7E8E4] bg-white">

          <div className="flex flex-col justify-between gap-4 border-b border-[#E7E8E4] px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-[#202421]">
                Your services
              </h2>

              <p className="mt-1 text-xs text-[#999E98]">
                Manage pricing, duration and availability.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-[#E7E8E4] px-3">
              <Search size={17} className="text-[#999E98]" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search services..."
                className="w-full py-2.5 text-sm outline-none sm:w-52"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#777D76]">
              <LoaderCircle size={19} className="animate-spin" />
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F2EE] text-[#647D68]">
                <BriefcaseBusiness size={22} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[#202421]">
                {services.length === 0
                  ? 'No services yet'
                  : 'No matching services'}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-[#777D76]">
                {services.length === 0
                  ? 'Add your first service to start managing what your business offers.'
                  : 'Try searching with a different service name.'}
              </p>

              {services.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#647D68] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#526D57]"
                >
                  <Plus size={16} />
                  Add your first service
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-[#FAFAF8]">
                  <tr>
                    {['Service', 'Price', 'Duration', 'Status', 'Actions'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-xs font-semibold text-[#777D76]"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E7E8E4]">
                  {filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      className="transition-colors hover:bg-[#FAFAF8]"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#202421]">
                          {service.name}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-[#999E98]">
                          {service.description || 'No description provided'}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-[#202421]">
                        {formatCurrency(service.price)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#777D76]">
                          <Clock3 size={15} />
                          {service.duration_minutes} min
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            service.is_active
                              ? 'bg-[#EEF2ED] text-[#526D57]'
                              : 'bg-[#F0F0EE] text-[#777D76]'
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
                            className="rounded-lg border border-[#E7E8E4] p-2 text-[#777D76] transition-colors hover:bg-[#F0F2EE] hover:text-[#526D57]"
                          >
                            <Pencil size={15} />
                          </button>

                          {service.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(service)}
                              title="Deactivate service"
                              className="rounded-lg border border-[#E7E8E4] p-2 text-[#777D76] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Power size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(service)}
                              title="Activate service"
                              className="rounded-lg border border-[#E7E8E4] px-3 py-2 text-xs font-medium text-[#526D57] transition-colors hover:bg-[#EEF2ED]"
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
          )}
        </section>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E7E8E4] bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-[#E7E8E4] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#202421]">
                  {editingService ? 'Edit service' : 'Add a service'}
                </h2>

                <p className="mt-1 text-xs text-[#777D76]">
                  Enter the details of your service below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-[#777D76] hover:bg-[#F7F7F5]"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#202421]">
                  Service name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Haircut"
                  maxLength={150}
                  required
                  className="w-full rounded-lg border border-[#E7E8E4] px-3 py-3 text-sm outline-none transition-colors focus:border-[#647D68]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#202421]">
                  Description
                  <span className="ml-1 font-normal text-[#999E98]">
                    (Optional)
                  </span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe what this service includes..."
                  className="w-full resize-none rounded-lg border border-[#E7E8E4] px-3 py-3 text-sm outline-none transition-colors focus:border-[#647D68]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#202421]">
                    Price (KSh)
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="500"
                    required
                    className="w-full rounded-lg border border-[#E7E8E4] px-3 py-3 text-sm outline-none focus:border-[#647D68]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#202421]">
                    Duration (minutes)
                  </label>

                  <input
                    type="number"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    className="w-full rounded-lg border border-[#E7E8E4] px-3 py-3 text-sm outline-none focus:border-[#647D68]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E7E8E4] pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-[#E7E8E4] px-4 py-2.5 text-sm font-medium text-[#777D76] hover:bg-[#F7F7F5] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#647D68] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#526D57] disabled:cursor-not-allowed disabled:opacity-60"
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
    </DashboardLayout>
  )
}

export default Services
