import { useState } from 'react'

import {
  Download,
  Printer,
  LoaderCircle,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react'

import {
  downloadProviderReport,
} from '../../services/analyticsService'

import { printBusinessReport } from './printReport'

const REPORTS = [
  {
    value: 'business',
    label: 'Business performance',
  },
  {
    value: 'services',
    label: 'Service performance',
  },
  {
    value: 'appointments',
    label: 'Appointment records',
  },
  {
    value: 'customers',
    label: 'Customer insights',
  },
]

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50'

export default function ReportActions({ data, disabled }) {
  const [report, setReport] = useState('business')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const unavailable = disabled || !data || exporting

  async function handleDownload() {
    if (unavailable) return

    setError('')
    setSuccess('')
    setExporting(true)

    try {
      await downloadProviderReport(report, data.period)

      setSuccess(
        'Report generated. Check your browser downloads.'
      )
    } catch (err) {
      setError(err.message || 'Unable to download report.')
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    if (unavailable) return

    setError('')
    setSuccess('')

    try {
      printBusinessReport(data)
    } catch (err) {
      setError(err.message || 'Unable to open printable report.')
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">
            Business reports
          </h2>

          <p className="mt-1 text-sm text-muted">
            Download business insights or generate a printable report.
          </p>

          {data && (
            <p className="mt-2 text-xs text-muted">
              {data.period.start_date} to {data.period.end_date}
              {' · East Africa Time'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select report type"
            value={report}
            disabled={unavailable}
            onChange={(event) => {
              setReport(event.target.value)
              setError('')
              setSuccess('')
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground disabled:opacity-50"
          >
            {REPORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={unavailable}
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}

            {exporting ? 'Generating...' : 'Download CSV'}
          </button>

          <button
            type="button"
            disabled={unavailable}
            onClick={handlePrint}
            className={buttonClass}
          >
            <Printer size={16} />
            Print / PDF
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger-text"
        >
          <TriangleAlert size={16} />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm text-success-text"
        >
          <CircleCheck size={16} />
          {success}
        </div>
      )}
    </section>
  )
}
