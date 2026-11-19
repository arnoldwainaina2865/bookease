
import { useEffect, useState } from 'react'

import {
  Clock,
  Globe,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'

import {
  getProviderBusinessHours,
  updateProviderBusinessHours,
} from '../../services/businessHoursService'


const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]


// Provide an editable starting schedule for new providers.
function createDefaultSchedule() {
  return DAYS.map((_, index) => ({
    day_of_week: index,
    opening_time: '09:00',
    closing_time: '17:00',
    is_closed: index >= 5,
  }))
}


// Convert the API response into a complete weekly schedule.
function normalizeSchedule(businessHours = []) {
  return createDefaultSchedule().map((day) => {
    const savedDay = businessHours.find(
      (item) => item.day_of_week === day.day_of_week
    )

    if (!savedDay) {
      return day
    }

    return {
      ...day,
      ...savedDay,
      opening_time: savedDay.opening_time || '09:00',
      closing_time: savedDay.closing_time || '17:00',
    }
  })
}


function Settings() {
  const [schedule, setSchedule] = useState([])
  const [originalSchedule, setOriginalSchedule] = useState([])

  const [isConfigured, setIsConfigured] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  const [refreshKey, setRefreshKey] = useState(0)

  // Retrieve the provider's saved business hours.
  useEffect(() => {
    let active = true

    getProviderBusinessHours()
      .then((data) => {
        if (!active) return

        const normalized = normalizeSchedule(
          data.business_hours
        )

        setSchedule(normalized)
        setOriginalSchedule(normalized)
        setIsConfigured(Boolean(data.is_configured))
      })
      .catch((err) => {
        if (!active) return

        setLoadError(
          err.response?.data?.message ||
          'Unable to retrieve business hours. Please try again.'
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [refreshKey])

  // Retry retrieving business hours.
  const fetchBusinessHours = () => {
    setLoading(true)
    setLoadError('')
    setError('')
    setSuccess('')
    setRefreshKey((current) => current + 1)
  }


  // Update an individual weekday.
  const updateDay = (dayIndex, field, value) => {
    setSchedule((previous) =>
      previous.map((day) =>
        day.day_of_week === dayIndex
          ? { ...day, [field]: value }
          : day
      )
    )

    setError('')
    setSuccess('')
  }


  // Restore the last successfully retrieved or saved schedule.
  const handleReset = () => {
    setSchedule(
      originalSchedule.map((day) => ({ ...day }))
    )

    setError('')
    setSuccess('')
  }


  // Validate all open days before submitting.
  const validateSchedule = () => {
    for (const day of schedule) {
      if (day.is_closed) {
        continue
      }

      if (!day.opening_time || !day.closing_time) {
        return `Please provide opening and closing times for ${DAYS[day.day_of_week]}.`
      }

      if (day.opening_time >= day.closing_time) {
        return `Closing time must be after opening time on ${DAYS[day.day_of_week]}.`
      }
    }

    return ''
  }


  // Save the weekly schedule.
  const handleSave = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const validationError = validateSchedule()

    if (validationError) {
      setError(validationError)
      return
    }

    const payload = schedule.map((day) => ({
      day_of_week: day.day_of_week,

      is_closed: day.is_closed,

      opening_time: day.is_closed
        ? null
        : day.opening_time,

      closing_time: day.is_closed
        ? null
        : day.closing_time,
    }))

    try {
      setSaving(true)

      const data = await updateProviderBusinessHours(payload)

      const normalized = normalizeSchedule(
        data.business_hours
      )

      setSchedule(normalized)
      setOriginalSchedule(normalized)

      setIsConfigured(Boolean(data.is_configured))

      setSuccess(
        'Your business hours have been updated successfully.'
      )

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save business hours. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }


  const hasChanges =
    JSON.stringify(schedule) !==
    JSON.stringify(originalSchedule)


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <RefreshCw
            size={26}
            className="animate-spin text-primary"
          />

          <p className="mt-4 text-sm text-muted">
            Loading your settings...
          </p>
        </div>
      </DashboardLayout>
    )
  }


  if (loadError) {
    return (
      <DashboardLayout>
        <div className="rounded-card border border-border bg-surface p-8 text-center">

          <AlertCircle
            size={28}
            className="mx-auto text-muted"
          />

          <h2 className="mt-4 font-semibold text-foreground">
            Settings unavailable
          </h2>

          <p className="mt-2 text-sm text-muted">
            {loadError}
          </p>

          <button
            type="button"
            onClick={fetchBusinessHours}
            className="mt-5 rounded-button bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </button>

        </div>
      </DashboardLayout>
    )
  }


  return (
    <DashboardLayout>

      <div className="space-y-8">

        {/* Page heading */}
        <header>
          <p className="text-sm text-muted">
            Provider workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>

          <p className="mt-2 text-sm text-muted">
            Manage your business preferences and availability.
          </p>
        </header>


        {/* Business hours card */}
        <form
          onSubmit={handleSave}
          className="max-w-5xl rounded-card border border-border bg-surface"
        >

          {/* Section heading */}
          <div className="border-b border-border p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary">
                <Clock size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Business hours
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Set the weekly working hours during which
                  customers can book your services.
                </p>
              </div>

            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-muted">
              <Globe size={16} />

              <span>
                Africa/Nairobi — East Africa Time (EAT)
              </span>
            </div>

          </div>


          <div className="p-6">

            {/* Unconfigured schedule notice */}
            {!isConfigured && (
              <div className="mb-6 flex items-start gap-3 rounded-button border border-border bg-surface-muted p-4">

                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Configure your business hours
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    You have not saved a weekly schedule yet.
                    Review the suggested hours below and save
                    them to restrict appointment bookings.
                  </p>
                </div>

              </div>
            )}


            {/* Weekly schedule */}
            <fieldset disabled={saving}>

              {schedule.map((day) => (
                <div
                  key={day.day_of_week}
                  className="grid grid-cols-1 items-center gap-4 border-b border-border py-5 lg:grid-cols-[140px_110px_1fr]"
                >

                  {/* Weekday */}
                  <p className="text-sm font-medium text-foreground">
                    {DAYS[day.day_of_week]}
                  </p>


                  {/* Open / closed switch */}
                  <div className="flex items-center gap-3">

                    <button
                      type="button"
                      role="switch"
                      aria-checked={!day.is_closed}
                      aria-label={`${DAYS[day.day_of_week]} availability`}
                      onClick={() =>
                        updateDay(
                          day.day_of_week,
                          'is_closed',
                          !day.is_closed
                        )
                      }
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        day.is_closed
                          ? 'bg-border'
                          : 'bg-primary'
                      }`}
                    >

                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow-sm transition-transform ${
                          day.is_closed
                            ? 'translate-x-0'
                            : 'translate-x-5'
                        }`}
                      />

                    </button>

                    <span
                      className={`text-sm ${
                        day.is_closed
                          ? 'text-muted'
                          : 'text-primary'
                      }`}
                    >
                      {day.is_closed ? 'Closed' : 'Open'}
                    </span>

                  </div>


                  {/* Opening and closing times */}
                  {day.is_closed ? (

                    <p className="text-sm text-muted">
                      Not accepting appointments
                    </p>

                  ) : (

                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">

                      <label className="block">
                        <span className="mb-2 block text-xs text-muted">
                          Opening time
                        </span>

                        <input
                          type="time"
                          required
                          value={day.opening_time}
                          onChange={(event) =>
                            updateDay(
                              day.day_of_week,
                              'opening_time',
                              event.target.value
                            )
                          }
                          className="w-full rounded-button border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                        />
                      </label>

                      <span className="pb-3 text-sm text-muted">
                        to
                      </span>

                      <label className="block">
                        <span className="mb-2 block text-xs text-muted">
                          Closing time
                        </span>

                        <input
                          type="time"
                          required
                          value={day.closing_time}
                          onChange={(event) =>
                            updateDay(
                              day.day_of_week,
                              'closing_time',
                              event.target.value
                            )
                          }
                          className="w-full rounded-button border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                        />
                      </label>

                    </div>

                  )}

                </div>
              ))}

            </fieldset>


            {/* Schedule guidance */}
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Customers can only create appointments that fit
              entirely within your configured working hours.
              Changes do not automatically cancel existing
              appointments.
            </p>


            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-button border border-danger/20 bg-danger-soft p-4 text-sm text-danger-text"
              >
                <AlertCircle size={18} className="shrink-0" />

                <span>{error}</span>
              </div>
            )}


            {/* Success message */}
            {success && (
              <div
                role="status"
                className="mt-5 flex items-start gap-3 rounded-button border border-border bg-primary-soft p-4 text-sm text-primary"
              >
                <CheckCircle2
                  size={18}
                  className="shrink-0"
                />

                <span>{success}</span>
              </div>
            )}

          </div>


          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-6">

            <p className="text-xs text-muted">
              {hasChanges
                ? 'You have unsaved changes.'
                : isConfigured
                  ? 'Your business hours are up to date.'
                  : 'Save your schedule to get started.'}
            </p>

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={handleReset}
                disabled={saving || !hasChanges}
                className="rounded-button border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={
                  saving || (isConfigured && !hasChanges)
                }
                className="flex items-center gap-2 rounded-button bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                {saving ? 'Saving...' : 'Save changes'}

              </button>

            </div>

          </div>

        </form>

      </div>

    </DashboardLayout>
  )
}


export default Settings
