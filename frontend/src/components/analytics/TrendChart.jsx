import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  formatCurrency,
  formatDate,
  formatNumber,
  panelClass,
} from './formatters'

export default function TrendChart({
  trends,
  mode = 'revenue',
}) {
  const financial = mode === 'revenue'

  const data = trends.map((row) => ({
    date: row.date,
    previousDate: row.previous_date,
    current: Number(
      financial ? row.revenue : row.bookings
    ),
    previous: Number(
      financial
        ? row.previous_revenue
        : row.previous_bookings
    ),
  }))

  const formatter = financial
    ? formatCurrency
    : formatNumber

  return (
    <section className={panelClass}>
      <h2 className="font-semibold text-foreground ">
        {financial ? 'Financial performance' : 'Appointment trends'}
      </h2>

      <p className="mt-1 text-sm text-muted ">
        {financial
          ? 'Completed booking value over time'
          : 'Daily appointment volume across all statuses'}
      </p>

      <div className="mt-5 flex flex-wrap gap-5 text-xs text-muted ">
        <span className="flex items-center gap-2">
          <span className="h-2 w-5 rounded-full bg-emerald-600" />
          Current period
        </span>

        <span className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-slate-400" />
          Previous period
        </span>
      </div>

      <div className="mt-6 h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: 5 }}>
            <CartesianGrid
              vertical={false}
              stroke="#94a3b8"
              strokeOpacity={0.15}
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />

            <YAxis
              width={financial ? 85 : 40}
              tickFormatter={formatter}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={financial}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null

                const row = payload[0].payload

                return (
                  <div className="rounded-xl border border-border bg-surface p-3 text-xs shadow-lg   ">
                    <p className="font-semibold">
                      {formatDate(row.date)}
                    </p>

                    <p className="mt-2 text-emerald-600 dark:text-emerald-400">
                      Current: {formatter(row.current)}
                    </p>

                    <p className="mt-1 text-muted ">
                      Previous ({formatDate(row.previousDate)}):{' '}
                      {formatter(row.previous)}
                    </p>
                  </div>
                )
              }}
            />

            <Line
              type="linear"
              dataKey="previous"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />

            <Line
              type="linear"
              dataKey="current"
              stroke="#059669"
              strokeWidth={2.5}
              dot={data.length === 1}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
