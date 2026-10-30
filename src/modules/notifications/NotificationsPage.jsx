import { useState } from 'react'
import { getNotifications, getResources } from '../../api/smartcivi'
import { useApi } from '../../hooks/useApi'

const NOTIFY_URL = import.meta.env.VITE_NOTIFY_API_URL || 'http://localhost:4000'
const STORAGE_KEY = 'smartreports.sent'

const CONTACT_PLACEHOLDERS = {
  Email: 'Recipient email',
  SMS: 'Mobile number',
  Announcement: 'Emails separated by commas, or "All Barangays"',
}

function loadSent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export default function NotificationsPage() {
  const notif = useApi(getNotifications)
  const res = useApi(getResources)
  const [sent, setSent] = useState(loadSent)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [form, setForm] = useState({ channel: 'Email', name: '', contact: '', message: '' })

  if (notif.loading || res.loading) return <p>Loading notifications...</p>

  const alerts = res.data
    .map((r) => ({ ...r, pct: Math.round((r.used / r.total) * 100) }))
    .filter((r) => r.pct >= 80)

  function saveSent(next) {
    setSent(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 200)))
    } catch {
      /* storage unavailable, keep in memory only */
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.contact || !form.message || sending) return
    setSending(true)
    setFeedback(null)

    let status = 'Sent'
    let error = ''
    try {
      const r = await fetch(`${NOTIFY_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: form.channel,
          name: form.name,
          recipient: form.contact,
          message: form.message,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || `Request failed (HTTP ${r.status})`)
    } catch (ex) {
      status = 'Failed'
      error = ex.message === 'Failed to fetch'
        ? 'Cannot reach the notification server. Make sure smartreports-api is running.'
        : ex.message
    }

    const entry = {
      id: Date.now(),
      channel: form.channel,
      name: form.name,
      recipient: form.name || form.contact,
      contact: form.contact,
      message: form.message,
      status,
      error,
      date: new Date().toISOString().slice(0, 10),
    }
    saveSent([entry, ...sent])

    if (status === 'Sent') {
      setFeedback({ ok: true, text: `${form.channel} sent to ${form.name ? form.name + ' - ' : ''}${form.contact}.` })
      setForm({ ...form, name: '', contact: '', message: '' })
    } else {
      setFeedback({ ok: false, text: `${error} (saved in History as Failed)` })
    }
    setSending(false)
  }

  function resend(n) {
    setForm({ channel: n.channel, name: n.name || '', contact: n.contact, message: n.message })
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const list = [...sent, ...notif.data]

  return (
    <section>
      <h2>Notifications</h2>
      <p className="muted">Citizen notices from the Civil Registry and resource alerts from Resource Planning.</p>

      <h3>Resource alerts</h3>
      {alerts.length === 0 && <p className="muted">No resource is running low.</p>}
      <ul className="list">
        {alerts.map((a) => (
          <li key={a.id}>
            <div><strong>{a.name}</strong><div className="muted">{a.category} - {a.pct}% used</div></div>
            <span className="badge pending">Low stock / high usage</span>
          </li>
        ))}
      </ul>

      <h3>Send a notification</h3>
      <form onSubmit={submit}>
        <div className="toolbar">
          <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            <option>Email</option>
            <option>SMS</option>
            <option>Announcement</option>
          </select>
          {form.channel !== 'Announcement' && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            className="grow"
            placeholder={CONTACT_PLACEHOLDERS[form.channel]}
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </div>
        <div className="toolbar">
          <input
            className="grow"
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button className="primary" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </form>
      {feedback && <p className={feedback.ok ? 'success' : 'error'}>{feedback.text}</p>}

      <h3>History</h3>
      <ul className="list">
        {list.map((n) => (
          <li key={n.id}>
            <div>
              <strong>{n.channel}</strong> to {n.recipient}
              {n.contact && n.contact !== n.recipient ? ` (${n.contact})` : ''} -{' '}
              <span className="muted">{n.date}</span>
              <div>{n.message}</div>
              {n.status === 'Failed' && n.error && <div className="error">{n.error}</div>}
            </div>
            <div className="row-actions">
              {n.status === 'Failed' && n.contact && (
                <button type="button" className="link" onClick={() => resend(n)}>Resend</button>
              )}
              <span className={`badge ${n.status.toLowerCase()}`}>{n.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
