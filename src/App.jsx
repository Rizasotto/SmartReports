import { useState } from 'react'
import ReportingPage from './modules/reporting/ReportingPage'
import NotificationsPage from './modules/notifications/NotificationsPage'
import MonitoringPage from './modules/monitoring/MonitoringPage'

const TABS = [
  { id: 'reporting', label: 'Reporting', Component: ReportingPage },
  { id: 'notifications', label: 'Notifications', Component: NotificationsPage },
  { id: 'monitoring', label: 'Monitoring', Component: MonitoringPage },
]

export default function App() {
  const [active, setActive] = useState('reporting')
  const { Component } = TABS.find((t) => t.id === active)

  return (
    <div className="layout">
      <header>
        <h1>SmartReports</h1>
      </header>
      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={t.id === active ? 'active' : ''} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main>
        <Component />
      </main>
    </div>
  )
}
