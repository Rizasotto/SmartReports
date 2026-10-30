import { getRegistrations, getResources } from '../../api/smartcivi'
import { useApi } from '../../hooks/useApi'

const STATUSES = ['Pending', 'Processing', 'Completed', 'Rejected']

export default function MonitoringPage() {
  const reg = useApi(getRegistrations)
  const res = useApi(getResources)
  if (reg.loading || res.loading) return <p>Loading monitoring data...</p>

  const total = reg.data.length
  const barangays = [...new Set(reg.data.map((r) => r.barangay))]

  return (
    <section>
      <h2>Monitoring</h2>
      <p className="muted">
        Live status of registry requests and LGU resources. Data source:{' '}
        <strong>{reg.live ? 'SmartCivi API' : 'sample data (SmartCivi API not reachable)'}</strong>
      </p>

      <h3>Request status</h3>
      <div className="cards">
        {STATUSES.map((s) => (
          <div className="card" key={s}>
            <span className="muted">{s}</span>
            <strong>{reg.data.filter((r) => r.status === s).length}</strong>
          </div>
        ))}
        <div className="card"><span className="muted">Total requests</span><strong>{total}</strong></div>
      </div>

      <h3>Requests per barangay</h3>
      {barangays.map((b) => {
        const n = reg.data.filter((r) => r.barangay === b).length
        const pct = Math.round((n / total) * 100)
        return (
          <div key={b} className="usage">
            <div className="usage-label"><span>{b}</span><span>{n} request(s)</span></div>
            <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
          </div>
        )
      })}

      <h3>Resource utilization</h3>
      {res.data.map((r) => {
        const pct = Math.round((r.used / r.total) * 100)
        return (
          <div key={r.id} className="usage">
            <div className="usage-label">
              <span>{r.name} <span className="muted">({r.category})</span></span>
              <span>{r.used.toLocaleString()} / {r.total.toLocaleString()} {r.unit} ({pct}%)</span>
            </div>
            <div className="bar"><div className={`fill ${pct >= 80 ? 'danger' : ''}`} style={{ width: `${pct}%` }} /></div>
          </div>
        )
      })}
    </section>
  )
}
