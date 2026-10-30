const BASE_URL = import.meta.env.VITE_SMARTCIVI_API_URL || 'http://localhost:8000/api'

async function request(path, fallback) {
  try {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { data: await res.json(), live: true }
  } catch (err) {
    console.warn(`SmartCivi API unavailable for ${path}, using sample data.`, err.message)
    return { data: fallback, live: false }
  }
}

// Civil Registry module of SmartCivi
const sampleRegistrations = [
  { id: 5, ref: 'CR-2026-0005', type: 'Death Certificate', applicant: 'Rosa Villanueva', barangay: 'Barangay San Roque', status: 'Pending', date: '2026-10-28' },
  { id: 4, ref: 'CR-2026-0004', type: 'Marriage Certificate', applicant: 'Carlo Ramos', barangay: 'Barangay San Jose', status: 'Processing', date: '2026-10-26' },
  { id: 3, ref: 'CR-2026-0003', type: 'Birth Certificate', applicant: 'Luz Mendoza', barangay: 'Barangay Poblacion', status: 'Rejected', date: '2026-10-22' },
  { id: 2, ref: 'CR-2026-0002', type: 'Birth Certificate', applicant: 'Pedro Garcia', barangay: 'Barangay San Isidro', status: 'Completed', date: '2026-10-18' },
  { id: 1, ref: 'CR-2026-0001', type: 'Marriage Certificate', applicant: 'Maria Santos', barangay: 'Barangay Poblacion', status: 'Completed', date: '2026-10-12' },
]

// Resource Planning module of SmartCivi
const sampleResources = [
  { id: 1, name: 'Civil Registry Staff', category: 'Personnel', used: 9, total: 10, unit: 'staff' },
  { id: 2, name: 'Security Paper (Certificates)', category: 'Supplies', used: 820, total: 1000, unit: 'sheets' },
  { id: 3, name: 'Printer Ink', category: 'Supplies', used: 4, total: 12, unit: 'cartridges' },
  { id: 4, name: 'Service Vehicles', category: 'Equipment', used: 2, total: 4, unit: 'vehicles' },
  { id: 5, name: 'Quarterly Budget', category: 'Finance', used: 310000, total: 500000, unit: 'PHP' },
]

const sampleNotifications = [
  { id: 1, channel: 'Announcement', recipient: 'All Barangays', message: 'Civil Registry office is closed on November 1.', status: 'Sent', date: '2026-10-28' },
  { id: 2, channel: 'Email', recipient: 'Rosa Villanueva', message: 'Please submit the missing requirements for CR-2026-0005.', status: 'Queued', date: '2026-10-28' },
  { id: 3, channel: 'SMS', recipient: 'Carlo Ramos', message: 'Your Marriage Certificate request (CR-2026-0004) is being processed.', status: 'Sent', date: '2026-10-26' },
  { id: 4, channel: 'SMS', recipient: 'Luz Mendoza', message: 'Your request CR-2026-0003 was returned. Please visit the office to correct the details.', status: 'Sent', date: '2026-10-22' },
  { id: 5, channel: 'SMS', recipient: 'Pedro Garcia', message: 'Your Birth Certificate (CR-2026-0002) is ready for pickup.', status: 'Sent', date: '2026-10-18' },
]

export const getRegistrations = () => request('/registrations', sampleRegistrations)
export const getResources = () => request('/resources', sampleResources)
export const getNotifications = () => request('/notifications', sampleNotifications)
