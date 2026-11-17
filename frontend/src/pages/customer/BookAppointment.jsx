import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock3, Scissors } from 'lucide-react'

import {
  getAvailableServices,
  createCustomerBooking,
  getServiceAvailability,
} from '../../services/customerApiService'
function getLocalDate() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year').value
  const month = parts.find((part) => part.type === 'month').value
  const day = parts.find((part) => part.type === 'day').value

  return `${year}-${month}-${day}`
}

function BookAppointment() {
  const [searchParams] = useSearchParams()

  const [services, setServices] = useState([])
  const [serviceId, setServiceId] = useState(
    searchParams.get('serviceId') || ''
  )
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')

  const [availability, setAvailability] = useState(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    let ignore = false
    const loadServices = async () => {
      try {
        const data = await getAvailableServices({ page: 1, per_page: 50 })
        if (ignore) return
        const items = data.services || []
        setServices(items)
        const requestedId = searchParams.get('serviceId')
        setServiceId(items.some((item) => String(item.id) === requestedId) ? requestedId : '')
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load available services.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadServices()
    return () => { ignore = true }
  }, [searchParams])

  const selectedService = services.find((service) => String(service.id) === String(serviceId))

  useEffect(() => {
    let ignore = false
    setAppointmentTime('')
    setAvailability(null)
    setAvailabilityError('')
    if (!serviceId || !appointmentDate) {
      setAvailabilityLoading(false)
      return
    }
    setAvailabilityLoading(true)
    const loadAvailability = async () => {
      try {
        const data = await getServiceAvailability(serviceId, appointmentDate)
        if (!ignore) setAvailability(data)
      } catch (err) {
        if (!ignore) setAvailabilityError(err.response?.data?.message || 'Unable to retrieve appointment availability.')
      } finally {
        if (!ignore) setAvailabilityLoading(false)
      }
    }
    loadAvailability()
    return () => { ignore = true }
  }, [serviceId, appointmentDate, refreshKey])

  const currentAvailability =
    availability && String(availability.service_id) === String(serviceId) &&
    availability.date === appointmentDate ? availability : null
  const availableSlots = currentAvailability?.available_slots || []
  // Only a completely absent schedule permits manual time selection.
  const allowManualTime = currentAvailability?.is_configured === false &&
    currentAvailability?.is_closed === null
  const selectedSlot = availableSlots.find((slot) => slot.start_time === appointmentTime)
  const startAt = allowManualTime && appointmentTime && appointmentDate
    ? `${appointmentDate}T${appointmentTime}:00+03:00`
    : selectedSlot?.start_at
  const canSubmit = Boolean(selectedService && currentAvailability &&
    !availabilityLoading && !availabilityError && !submitting &&
    appointmentDate >= getLocalDate() && startAt &&
    Number.isFinite(Date.parse(startAt)) && Date.parse(startAt) > Date.now())

  const refreshAvailability = () => {
    setAppointmentTime('')
    setAvailability(null)
    setAvailabilityError('')
    setAvailabilityLoading(true)
    setRefreshKey((value) => value + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    if (!canSubmit || Date.parse(startAt) <= Date.now()) {
      setError('Please select an available appointment time in the future.')
      return
    }
    setSubmitting(true)
    try {
      const response = await createCustomerBooking({
        service_id: Number(serviceId),
        start_at: new Date(startAt).toISOString(),
        customer_notes: notes.trim(),
      })
      setSuccess(response.booking)
      setAppointmentDate('')
      setAppointmentTime('')
      setNotes('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your booking. Please try again.')
      if ([400, 404, 409].includes(err.response?.status)) refreshAvailability()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <p className="text-sm text-[#777D76]">
          Loading available services...
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-5 py-12">
        <section className="w-full max-w-lg bg-white border border-[#E7E8E4] rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#EEF3ED] text-[#647D68] flex items-center justify-center mb-5">
            <CalendarDays size={26} />
          </div>

          <h1 className="text-2xl font-semibold text-[#202421]">
            Booking submitted
          </h1>

          <p className="text-sm text-[#777D76] mt-3">
            Your appointment request has been received and is awaiting provider approval.
          </p>

          <div className="bg-[#F7F7F5] rounded-xl p-5 text-left mt-7 space-y-3">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777D76]">Service</span>
              <span className="font-medium text-right">{success.service}</span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777D76]">Provider</span>
              <span className="font-medium text-right">{success.provider}</span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777D76]">Date</span>
              <span className="font-medium">
                {new Date(success.start_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777D76]">Time</span>
              <span className="font-medium">
                {new Date(success.start_at).toLocaleTimeString('en-KE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Africa/Nairobi',
                })}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777D76]">Amount</span>
              <span className="font-semibold text-[#647D68]">
                KSh {Number(success.total_price).toLocaleString('en-KE')}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777D76]">Status</span>
              <span className="font-medium text-amber-700 capitalize">
                {success.status}
              </span>
            </div>
          </div>

          <Link
            to="/customer/dashboard"
            className="block w-full bg-[#647D68] hover:bg-[#526A56] text-white rounded-lg py-3 mt-7 text-sm font-medium transition-colors"
          >
            Return to dashboard
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#202421]">
      <header className="bg-white border-b border-[#E7E8E4]">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Link
            to="/customer/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#647D68] hover:text-[#526A56]"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-[#777D76] mb-2">
            BOOKEASE / APPOINTMENTS
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Book an appointment
          </h1>

          <p className="text-sm text-[#777D76] mt-2">
            Choose your preferred service and appointment time.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {services.length === 0 ? (
          <div className="bg-white border border-[#E7E8E4] rounded-xl p-8 text-center">
            <p className="text-[#777D76] text-sm">
              No services are currently available for booking.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E7E8E4] rounded-2xl p-7 space-y-7 shadow-sm"
          >
            <div>
              <label
                htmlFor="service"
                className="block text-sm font-medium mb-2"
              >
                Select a service
              </label>

              <select
                id="service"
                value={serviceId}
                disabled={submitting}
                onChange={(event) => {
                  setAppointmentTime('')
                  setAvailability(null)
                  setAvailabilityError('')
                  setError('')
                  setServiceId(event.target.value)
                }}
                required
                className="w-full border border-[#E7E8E4] rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-[#647D68]"
              >
                <option value="">Choose a service</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — KSh {service.price}
                  </option>
                ))}
              </select>
            </div>

            {selectedService && (
              <div className="bg-[#F7F7F5] rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E9EEE8] text-[#647D68] flex items-center justify-center shrink-0">
                    <Scissors size={19} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {selectedService.name}
                    </h3>

                    <p className="text-sm text-[#777D76] mt-1">
                      {selectedService.description}
                    </p>

                    <p className="text-sm text-[#777D76] mt-2">
                      {selectedService.provider.business_name}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <span className="font-semibold text-[#647D68]">
                        KSh {Number(selectedService.price).toLocaleString('en-KE')}
                      </span>

                      <span className="flex items-center gap-1 text-[#777D76]">
                        <Clock3 size={15} />
                        {selectedService.duration_minutes} minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="appointment-date" className="block text-sm font-medium mb-2">
                  Appointment date
                </label>
                <input id="appointment-date" type="date" value={appointmentDate}
                  min={getLocalDate()} required disabled={submitting}
                  onChange={(event) => {
                    setAppointmentTime('')
                    setAvailability(null)
                    setAvailabilityError('')
                    setError('')
                    setAppointmentDate(event.target.value)
                  }}
                  className="w-full border border-[#E7E8E4] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]" />
              </div>
              <section className="space-y-4" aria-labelledby="appointment-time-heading">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="appointment-time-heading" className="text-sm font-medium">Appointment time</h3>
                  <span className="text-xs text-[#777D76]">East Africa Time (EAT)</span>
                </div>
                {!selectedService || !appointmentDate ? (
                  <p className="rounded-xl border border-dashed border-[#E7E8E4] p-5 text-sm text-[#777D76]">Select a service and date to view available times.</p>
                ) : availabilityLoading ? (
                  <p role="status" className="rounded-xl bg-[#F7F7F5] p-5 text-sm text-[#777D76]">Checking appointment availability...</p>
                ) : availabilityError ? (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>{availabilityError}</p>
                    <button type="button" onClick={refreshAvailability} className="mt-2 font-medium underline">Try again</button>
                  </div>
                ) : !currentAvailability ? (
                  <p role="status" className="text-sm text-[#777D76]">Waiting for appointment availability...</p>
                ) : allowManualTime ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[#777D76]">This provider has not configured business hours. Choose a preferred time; availability will be checked when you submit.</p>
                    <input aria-label="Preferred appointment time" type="time" value={appointmentTime}
                      required disabled={submitting} onChange={(event) => setAppointmentTime(event.target.value)}
                      className="w-full border border-[#E7E8E4] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68]" />
                  </div>
                ) : currentAvailability.is_closed ? (
                  <p className="rounded-xl bg-[#F7F7F5] p-5 text-sm text-[#777D76]">This provider is closed on the selected day. Please choose another date.</p>
                ) : availableSlots.length === 0 ? (
                  <p className="rounded-xl bg-[#F7F7F5] p-5 text-sm text-[#777D76]">No appointment slots are available on this date. Please choose another date.</p>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm text-[#777D76]">{availableSlots.length} appointment slots available</p>
                    {[
                      { label: 'Morning', slots: availableSlots.filter((slot) => Number(slot.start_time.split(':')[0]) < 12) },
                      { label: 'Afternoon', slots: availableSlots.filter((slot) => Number(slot.start_time.split(':')[0]) >= 12) },
                    ].map((group) => group.slots.length > 0 && (
                      <div key={group.label}>
                        <p className="mb-3 text-xs font-medium text-[#777D76]">{group.label}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {group.slots.map((slot) => (
                            <button key={slot.start_at} type="button" disabled={submitting}
                              aria-pressed={appointmentTime === slot.start_time}
                              onClick={() => { setAppointmentTime(slot.start_time); setError('') }}
                              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${appointmentTime === slot.start_time ? 'bg-[#647D68] border-[#647D68] text-white' : 'bg-white border-[#E7E8E4] text-[#202421] hover:border-[#647D68] hover:bg-[#F5F7F4]'}`}>
                              {slot.start_time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {selectedSlot && (
                      <div className="rounded-xl bg-[#EEF2ED] p-4">
                        <p className="text-xs text-[#777D76]">Selected appointment</p>
                        <p className="mt-1 text-sm font-semibold text-[#526D57]">{selectedSlot.start_time} – {selectedSlot.end_time} EAT</p>
                      </div>
                    )}
                  </div>
                )}
                {currentAvailability && !availabilityLoading && (
                  <button type="button" disabled={submitting} onClick={refreshAvailability} className="text-sm font-medium text-[#526D57] underline disabled:opacity-50">Refresh availability</button>
                )}
              </section>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium mb-2"
              >
                Additional notes
                <span className="font-normal text-[#929890]"> (optional)</span>
              </label>

              <textarea
                id="notes"
                value={notes}
                disabled={submitting}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Any preferences or information the provider should know?"
                className="w-full border border-[#E7E8E4] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#647D68] resize-y"
              />

              <p className="text-xs text-[#929890] text-right mt-1">
                {notes.length}/1000 characters
              </p>
            </div>

            <div className="border-t border-[#E7E8E4] pt-6">

              {/* Cancellation policy */}
              <div className="mb-5 rounded-xl border border-[#E7E8E4] bg-[#F5F7F4] p-4">
                <div className="flex items-center gap-2">
                  <Clock3 size={18} className="text-[#647D68]" />

                  <h3 className="text-sm font-semibold text-[#24352B]">
                    Cancellation policy
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  You can cancel your appointment more than 24 hours
                  before its scheduled start time. Cancellations within
                  24 hours of the appointment are not permitted.
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-[#647D68] hover:bg-[#526A56] disabled:opacity-60 text-white rounded-lg py-3 text-sm font-medium transition-colors"
              >
                {submitting ? 'Submitting booking...' : 'Confirm booking request'}
              </button>

              <p className="text-xs text-center text-[#929890] mt-3">
                Your booking will remain pending until the provider responds.
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export default BookAppointment
