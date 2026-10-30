import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'

const {
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  SEMAPHORE_API_KEY,
  SEMAPHORE_SENDER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM,
  ANNOUNCEMENT_EMAILS,
} = process.env

const app = express()
app.use(cors())
app.use(express.json())

const GMAIL = { host: 'smtp.gmail.com', port: 465, secure: true }
const YAHOO = { host: 'smtp.mail.yahoo.com', port: 465, secure: true }
const OUTLOOK = { host: 'smtp-mail.outlook.com', port: 587, secure: false }
const PROVIDERS = {
  'gmail.com': GMAIL,
  'googlemail.com': GMAIL,
  'yahoo.com': YAHOO,
  'ymail.com': YAHOO,
  'outlook.com': OUTLOOK,
  'hotmail.com': OUTLOOK,
  'live.com': OUTLOOK,
}

const defaultTransporter =
  SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({ ...GMAIL, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    : null

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function normalizeNumber(raw) {
  const v = String(raw).replace(/[\s()-]/g, '')
  if (/^09\d{9}$/.test(v)) return '+63' + v.slice(1)
  if (/^639\d{9}$/.test(v)) return '+' + v
  if (/^\+\d{7,15}$/.test(v)) return v
  if (/^\d{7,15}$/.test(v)) return '+' + v
  return null
}

async function sendEmail({ to, bcc, subject, text, sender }) {
  let transporter
  let fromAddress

  if (sender && sender.email) {
    if (!isEmail(sender.email)) throw new Error('The sender email is not valid.')
    if (!sender.password) throw new Error('Enter the password (App Password) for the sender email.')
    const domain = sender.email.split('@')[1].toLowerCase()
    const provider = PROVIDERS[domain]
    if (!provider) {
      throw new Error(`Sender provider "${domain}" is not supported. Use a Gmail, Yahoo, or Outlook/Hotmail account.`)
    }
    transporter = nodemailer.createTransport({ ...provider, auth: { user: sender.email, pass: sender.password } })
    fromAddress = sender.email
  } else {
    if (!defaultTransporter) {
      throw new Error('No sender account. Enter a sender email and app password in the form, or set SMTP_USER and SMTP_PASS in .env.')
    }
    transporter = defaultTransporter
    fromAddress = SMTP_USER
  }

  await transporter.sendMail({
    from: sender && sender.email ? `SmartReports <${fromAddress}>` : MAIL_FROM || `SmartReports <${fromAddress}>`,
    to: to || fromAddress,
    bcc,
    subject,
    text,
  })
}

async function sendSms(e164, message) {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body: new URLSearchParams({ To: e164, From: TWILIO_FROM, Body: message }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.message || `SMS provider error (HTTP ${res.status})`)
    }
    return
  }

  if (SEMAPHORE_API_KEY) {
    if (!e164.startsWith('+63')) {
      throw new Error('Semaphore only sends to Philippine numbers. Set the TWILIO_* values in .env for other countries.')
    }
    const body = new URLSearchParams({ apikey: SEMAPHORE_API_KEY, number: e164.slice(1), message })
    if (SEMAPHORE_SENDER) body.set('sendername', SEMAPHORE_SENDER)
    const res = await fetch('https://api.semaphore.co/api/v4/messages', { method: 'POST', body })
    if (!res.ok) throw new Error(`SMS provider error (HTTP ${res.status})`)
    return
  }

  throw new Error('SMS is not configured. Set SEMAPHORE_API_KEY (PH) or the TWILIO_* values in the .env file.')
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    defaultEmail: Boolean(defaultTransporter),
    sms: Boolean(SEMAPHORE_API_KEY || (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM)),
  })
})

app.post('/api/send', async (req, res) => {
  const { channel, name, recipient, message, senderEmail, senderPassword } = req.body || {}
  if (!channel || !recipient || !message) {
    return res.status(400).json({ ok: false, error: 'channel, recipient and message are required' })
  }
  const sender = senderEmail ? { email: senderEmail.trim(), password: senderPassword } : null

  try {
    if (channel === 'Email') {
      if (!isEmail(recipient.trim())) throw new Error('Enter a valid recipient email address.')
      const greeting = name ? `Hello ${name},\n\n` : ''
      await sendEmail({
        to: recipient.trim(),
        subject: 'SmartCivi Notification',
        text: `${greeting}${message}\n\n- SmartCivi Civil Registry`,
        sender,
      })
    } else if (channel === 'SMS') {
      const number = normalizeNumber(recipient)
      if (!number) throw new Error('Enter a valid mobile number, e.g. 09171234567 or +14155550123.')
      await sendSms(number, message)
    } else if (channel === 'Announcement') {
      const source = recipient.includes('@') ? recipient : ANNOUNCEMENT_EMAILS || ''
      const list = source.split(/[,;\s]+/).map((s) => s.trim()).filter(isEmail)
      if (list.length === 0) {
        throw new Error('No email recipients. Type emails separated by commas, or set ANNOUNCEMENT_EMAILS in .env.')
      }
      await sendEmail({ bcc: list.join(','), subject: 'SmartCivi Announcement', text: message, sender })
    } else {
      throw new Error('Unknown channel.')
    }
    res.json({ ok: true })
  } catch (err) {
    let msg = err.message
    if (err.responseCode === 535 || /Invalid login|not accepted|authentication/i.test(msg)) {
      msg = 'The email provider rejected the login. For Gmail or Yahoo use an App Password (not your normal password) and check that the sender email is correct.'
    }
    console.error(`[send] ${channel} failed: ${msg}`)
    res.status(500).json({ ok: false, error: msg })
  }
})

app.listen(4000, () => console.log('SmartReports notification server on port 4000'))
