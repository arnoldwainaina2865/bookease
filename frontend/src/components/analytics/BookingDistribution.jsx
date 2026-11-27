import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { panelClass } from './formatters'

const COLORS = {
  completed: '#059669',
  confirmed: '#647fa6',
  pending: '#d4a34a',
  cancelled: '#d17b7b',
  rejected: '#94a3b8',
}

export default function BookingDistribution({ distribution }) {
  const total = distribution.reduce(
    (sum, row) => sum + row.count,
    0
  )

  const data = distribution.filter((row) => row.count > 0)

  return (
    <section className={panelClass}>
      <h2 className="font-semibold text-foreground ">
        Booking distribution
      </h2>

      <p className="mt-1 text-sm text-muted ">
        Appointment status breakdown
      </p>

      <div className="relative mt-4 h-52">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={65}
                outerRadius={88}
                paddingAngle={data.length > 1 ? 3 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((row) => (
                  <Cell
                    key={row.status}
                    fill={COLORS[row.status]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-44 w-44 rounded-full border-[23px] border-border " />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-foreground ">
            {total}
          </span>
          <span className="text-xs text-muted ">
            Appointments
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {distribution.map((row) => (
          <div key={row.status} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[row.status] }}
            />

            <span className="flex-1 capitalize text-muted ">
              {row.status}
            </span>

            <span className="font-medium text-foreground ">
              {row.count}
            </span>

            <span className="w-14 text-right text-xs text-muted ">
              {total ? ((row.count / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
