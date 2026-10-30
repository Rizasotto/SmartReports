import { useMemo, useState } from 'react'
import { getRegistrations } from '../../api/smartcivi'
import { useApi } from '../../hooks/useApi'

const TYPES = ['Birth Certificate', 'Marriage Certificate', 'Death Certificate']
const STATUSES = ['Pending', 'Processing', 'Completed', 'Rejected']

export default function ReportingPage() {
  const { data, loading } = useApi(getRegistrations)
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')

  const all = data || []
  const rows = useMemo(
    () => all.filter((r) => (type === 'All' || r.type === type) && (status === 'All' || r.status === status)),
    [all, type, status],
  )

  if (loading) return <p>Loading civil registry report...</p>

  function exportCsv() {
    const header = ['Reference', 'Type', 'Applicant', 'Barangay', 'Status', 'Date']
    const lines = [header, ...rows.map((r) => [r.ref, r.type, r.applicant, r.barangay, r.status, r.date])]
      .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smartcivi-registry-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <h2>Civil Registry Report</h2>
      <p className="muted">Birth, marriage, and death registrations recorded in SmartCivi.</p>

      <div className="cards">
        {TYPES.map((t) => (
          <div className="card" key={t}>
            <span className="muted">{t}</span>
            <strong>{all.filter((r) => r.type === t).length}</strong>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>All</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="primary" onClick={exportCsv}>Export CSV</button>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <table>
        <thead>
          <tr><th>Reference</th><th>Type</th><th>Applicant</th><th>Barangay</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.ref}</td>
              <td>{r.type}</td>
              <td>{r.applicant}</td>
              <td>{r.barangay}</td>
              <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
              <td>{r.date}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="6" className="muted">No records match the filters.</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
