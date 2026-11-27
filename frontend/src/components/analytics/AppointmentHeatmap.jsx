import { Clock3, CalendarDays } from 'lucide-react'

import {
  formatHour,
  panelClass,
} from './formatters'

const DAYS = [
  'Mon', 'Tue', 'Wed', 'Thu',
  'Fri', 'Sat', 'Sun',
]

export default function AppointmentHeatmap({ operations }) {
  const maximum = Math.max(
    1,
    ...operations.heatmap.map((cell) => cell.bookings)
  )

  const cells = new Map(
    operations.heatmap.map((cell) => [
      `${cell.day}-${cell.hour}`,
      cell.bookings,
    ])
  )

  return (
    <section className={panelClass}>
      <h2 className="font-semibold text-foreground ">
        Appointment activity
      </h2>

      <p className="mt-1 text-sm text-muted ">
        Pending, confirmed and completed appointments by local time
      </p>

      <div className="my-5 grid gap-3 sm:grid-cols-2">
        {[
          {
            label: 'Peak hour',
            value: formatHour(operations.peak_hour),
            icon: Clock3,
          },
          {
            label: 'Busiest day',
            value: operations.busiest_day || 'No activity',
            icon: CalendarDays,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl bg-surface-muted p-4 "
          >
            <Icon size={20} className="text-emerald-600" />

            <div>
              <p className="text-xs text-muted ">
                {label}
              </p>

              <p className="mt-1 font-semibold text-foreground ">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-[720px] items-center gap-1"
          style={{
            gridTemplateColumns: '40px repeat(24, minmax(20px, 1fr))',
          }}
        >
          <div />

          {Array.from({ length: 24 }, (_, hour) => (
            <span
              key={hour}
              className="text-center text-[10px] text-muted "
            >
              {hour % 2 === 0 ? String(hour).padStart(2, '0') : ''}
            </span>
          ))}

          {DAYS.map((day, dayIndex) => (
            <div key={day} className="contents">
              <span className="text-xs text-muted ">
                {day}
              </span>

              {Array.from({ length: 24 }, (_, hour) => {
                const count = cells.get(`${dayIndex}-${hour}`) || 0

                return (
                  <div
                    key={hour}
                    role="img"
                    aria-label={`${day} ${formatHour(hour)}: ${count} appointments`}
                    title={`${day} ${formatHour(hour)}: ${count} appointments`}
                    className="aspect-square rounded-sm bg-surface-muted"
                    style={
                      count > 0
                        ? {
                            backgroundColor: `rgba(5, 150, 105, ${0.25 + 0.75 * count / maximum})`,
                          }
                        : undefined
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5">
        <span className="mr-1 text-xs text-muted">
          Less busy
        </span>

        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <span
            key={level}
            className="h-3 w-3 rounded-sm bg-surface-muted"
            style={
              level
                ? { backgroundColor: `rgba(5, 150, 105, ${level})` }
                : undefined
            }
          />
        ))}

        <span className="ml-1 text-xs text-muted">
          More busy
        </span>
      </div>
    </section>
  )
}
