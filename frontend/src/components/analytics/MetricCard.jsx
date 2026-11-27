import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

import { panelClass } from './formatters'

export default function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  percentagePoints = false,
  inverse = false,
}) {
  const available = change !== null && change !== undefined

  const positive = inverse ? change < 0 : change > 0

  const ChangeIcon =
    change > 0
      ? ArrowUpRight
      : change < 0
        ? ArrowDownRight
        : Minus

  const changeColor =
    !available || change === 0
      ? 'text-muted '
      : positive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400'

  return (
    <div className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted ">
          {label}
        </p>

        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground ">
        {value}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        {available ? (
          <>
            <span className={`inline-flex items-center gap-1 font-medium ${changeColor}`}>
              <ChangeIcon size={14} />
              {change > 0 ? '+' : ''}
              {Number(change).toFixed(1)}
              {percentagePoints ? ' pp' : '%'}
            </span>

            <span className="text-muted ">
              vs previous period
            </span>
          </>
        ) : (
          <span className="text-muted ">
            No comparable previous activity
          </span>
        )}
      </div>
    </div>
  )
}
