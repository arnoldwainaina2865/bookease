import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatHour,
} from './formatters'

export function printBusinessReport(data) {
  const reportWindow = window.open(
    '',
    '_blank',
    'width=1100,height=850'
  )

  if (!reportWindow) {
    throw new Error(
      'Allow pop-ups in your browser to open the printable report.'
    )
  }

  reportWindow.opener = null

  const doc = reportWindow.document

  doc.title = 'BookEase - Business Performance Report'
  doc.documentElement.lang = 'en'

  const style = doc.createElement('style')

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #24332b;
      background: #ffffff;
      max-width: 1000px;
      margin: 35px auto;
      padding: 0 30px;
      font-size: 13px;
      line-height: 1.6;
    }

    .brand {
      color: #175c43;
      font-size: 25px;
      font-weight: 700;
      letter-spacing: -1px;
    }

    .eyebrow {
      color: #64746b;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    h1 {
      font-size: 28px;
      line-height: 1.2;
      margin: 12px 0;
    }

    h2 {
      font-size: 17px;
      margin: 30px 0 12px;
      color: #175c43;
      break-after: avoid;
    }

    p {
      margin: 5px 0;
    }

    .header {
      border-bottom: 2px solid #175c43;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .muted {
      color: #64746b;
      font-size: 12px;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 20px 0;
    }

    .metric {
      border: 1px solid #dce5df;
      border-radius: 8px;
      padding: 15px;
      break-inside: avoid;
    }

    .metric-label {
      color: #64746b;
      font-size: 11px;
    }

    .metric-value {
      font-size: 22px;
      font-weight: 700;
      color: #175c43;
      margin-top: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
    }

    th, td {
      border-bottom: 1px solid #dce5df;
      padding: 10px;
      text-align: left;
      overflow-wrap: anywhere;
    }

    th {
      background: #edf4ef;
      color: #175c43;
      font-weight: 600;
    }

    tr {
      break-inside: avoid;
    }

    thead {
      display: table-header-group;
    }

    .footer {
      border-top: 1px solid #dce5df;
      margin-top: 30px;
      padding-top: 15px;
      color: #64746b;
      font-size: 11px;
    }

    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 20px;
    }

    button {
      background: #175c43;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 18px;
      cursor: pointer;
      font-size: 13px;
    }

    @page {
      size: A4;
      margin: 15mm;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
        max-width: none;
        font-size: 11px;
      }

      .toolbar {
        display: none;
      }

      .metric-value {
        font-size: 18px;
      }

      h1 {
        font-size: 24px;
      }

      th {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `

  doc.head.appendChild(style)

  function element(tag, text, className) {
    const node = doc.createElement(tag)

    if (text !== undefined && text !== null) {
      node.textContent = String(text)
    }

    if (className) {
      node.className = className
    }

    return node
  }

  function addTable(title, headers, rows) {
    doc.body.appendChild(element('h2', title))

    const table = element('table')
    const head = element('thead')
    const headerRow = element('tr')

    headers.forEach((header) => {
      headerRow.appendChild(element('th', header))
    })

    head.appendChild(headerRow)
    table.appendChild(head)

    const body = element('tbody')

    if (rows.length === 0) {
      const row = element('tr')
      const cell = element('td', 'No activity in this period.')
      cell.colSpan = headers.length
      row.appendChild(cell)
      body.appendChild(row)
    }

    rows.forEach((values) => {
      const row = element('tr')

      values.forEach((value) => {
        row.appendChild(element('td', value))
      })

      body.appendChild(row)
    })

    table.appendChild(body)
    doc.body.appendChild(table)
  }

  const toolbar = element('div', null, 'toolbar')

  const printButton = element('button', 'Print / Save as PDF')
  printButton.addEventListener('click', () => reportWindow.print())

  const closeButton = element('button', 'Close report')
  closeButton.addEventListener('click', () => reportWindow.close())

  toolbar.append(printButton, closeButton)
  doc.body.appendChild(toolbar)

  const header = element('header', null, 'header')

  header.appendChild(element('div', 'BookEase', 'brand'))
  header.appendChild(
    element('div', 'Business intelligence', 'eyebrow')
  )

  header.appendChild(
    element('h1', 'Business Performance Report')
  )

  header.appendChild(
    element(
      'p',
      data.provider?.business_name || 'Provider workspace'
    )
  )

  header.appendChild(
    element(
      'p',
      `Reporting period: ${data.period.start_date} to ${data.period.end_date}`,
      'muted'
    )
  )

  header.appendChild(
    element(
      'p',
      `Previous period: ${data.period.previous_start_date} to ${data.period.previous_end_date}`,
      'muted'
    )
  )

  header.appendChild(
    element(
      'p',
      `Generated: ${new Date().toLocaleString('en-KE', {
        timeZone: 'Africa/Nairobi',
      })} EAT`,
      'muted'
    )
  )

  doc.body.appendChild(header)

  const overview = data.overview
  const previous = data.previous_overview

  const metrics = [
    ['Completed booking value', formatCurrency(overview.completed_booking_value)],
    ['Total appointments', formatNumber(overview.total_bookings)],
    ['Completion rate', formatPercent(overview.completion_rate)],
    ['Unique customers', formatNumber(overview.unique_customers)],
    ['Average booking value', formatCurrency(overview.average_booking_value)],
    ['Cancellation rate', formatPercent(overview.cancellation_rate)],
  ]

  const metricGrid = element('div', null, 'metrics')

  metrics.forEach(([label, value]) => {
    const card = element('div', null, 'metric')

    card.appendChild(
      element('div', label, 'metric-label')
    )

    card.appendChild(
      element('div', value, 'metric-value')
    )

    metricGrid.appendChild(card)
  })

  doc.body.appendChild(metricGrid)

  addTable(
    'Business performance comparison',
    ['Metric', 'Current period', 'Previous period'],
    [
      [
        'Total appointments',
        overview.total_bookings,
        previous.total_bookings,
      ],
      [
        'Completed appointments',
        overview.completed_bookings,
        previous.completed_bookings,
      ],
      [
        'Completed booking value',
        formatCurrency(overview.completed_booking_value),
        formatCurrency(previous.completed_booking_value),
      ],
      [
        'Average booking value',
        formatCurrency(overview.average_booking_value),
        formatCurrency(previous.average_booking_value),
      ],
      [
        'Completion rate',
        formatPercent(overview.completion_rate),
        formatPercent(previous.completion_rate),
      ],
      [
        'Cancellation rate',
        formatPercent(overview.cancellation_rate),
        formatPercent(previous.cancellation_rate),
      ],
    ]
  )

  addTable(
    'Appointment status breakdown',
    ['Status', 'Appointments'],
    data.booking_distribution.map((row) => [
      row.status.charAt(0).toUpperCase() + row.status.slice(1),
      row.count,
    ])
  )

  addTable(
    'Service performance',
    ['Service', 'Appointments', 'Completed', 'Completion', 'Booking value'],
    data.services.map((row) => [
      row.name,
      row.bookings,
      row.completed,
      formatPercent(row.completion_rate),
      formatCurrency(row.revenue),
    ])
  )

  addTable(
    'Customer insights',
    ['Metric', 'Value'],
    [
      ['Unique customers', data.customers.unique_customers],
      ['Completed customers', data.customers.completed_customers],
      ['New customers', data.customers.new_customers],
      ['Returning customers', data.customers.returning_customers],
      [
        'Returning customer rate',
        formatPercent(data.customers.returning_customer_rate),
      ],
    ]
  )

  addTable(
    'Operational insights',
    ['Metric', 'Value'],
    [
      ['Peak appointment hour', formatHour(data.operations.peak_hour)],
      ['Busiest day', data.operations.busiest_day || 'No activity'],
      ['Reporting timezone', 'Africa/Nairobi (EAT)'],
    ]
  )

  const footer = element('footer', null, 'footer')

  footer.appendChild(
    element(
      'p',
      'Financial figures represent completed appointment values, not verified payments or business profit.'
    )
  )

  footer.appendChild(
    element(
      'p',
      'Reports are based on appointment start dates and current booking statuses.'
    )
  )

  footer.appendChild(
    element(
      'p',
      'Confidential business information — Generated by BookEase.'
    )
  )

  doc.body.appendChild(footer)

  reportWindow.focus()
}
