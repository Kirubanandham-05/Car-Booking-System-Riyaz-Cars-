const nodemailer = (() => {
  try {
    return require('nodemailer')
  } catch (e) {
    return null
  }
})()

// create transporter: prefer configured SMTP, otherwise fall back to Ethereal test account
async function createTransporter() {
  if (!nodemailer) return null

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  }

  // If disabled explicitly, don't create ethereal
  if (process.env.DISABLE_ETHEREAL === 'true') return null

  // create a test account via nodemailer (Ethereal) to allow local testing without SMTP
  try {
    const testAccount = await nodemailer.createTestAccount()
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    transporter.__isEthereal = true
    transporter.__etherealInfo = testAccount
    return transporter
  } catch (e) {
    console.error('Failed to create ethereal test account:', e)
    return null
  }
}

const defaultFrom = process.env.EMAIL_FROM || 'no-reply@example.com'

async function sendMail({ to, subject, text, html }) {
  try {
    const transporter = await createTransporter()
    if (!transporter) {
      console.log('Email not sent (transporter not configured).', { to, subject })
      return { ok: false, info: null }
    }

    const info = await transporter.sendMail({ from: defaultFrom, to, subject, text, html })
    // If transporter is ethereal, include preview URL
    if (transporter.__isEthereal) {
      const preview = nodemailer.getTestMessageUrl(info)
      return { ok: true, info, preview }
    }
    return { ok: true, info }
  } catch (err) {
    console.error('sendMail error:', err)
    return { ok: false, error: err }
  }
}

// Simple text + HTML templates
function contactNotificationTemplate({ ownerName, ownerEmail, subject, body, sender }) {
  const text = `New message from ${sender?.name || 'a user'} (${sender?.email || 'unknown'}):\n\n${body}`
  const html = `<p>New message from <strong>${sender?.name || 'a user'}</strong> (<a href="mailto:${sender?.email || ''}">${sender?.email || ''}</a>)</p><p><strong>Subject:</strong> ${subject || '(none)'}</p><p>${escapeHtml(body)}</p>`
  return { text, html }
}

function replyTemplate({ replyBody, originalMessage }) {
  const text = `${replyBody}\n\n----\nOriginal message:\n${originalMessage}`
  const html = `<div>${escapeHtml(replyBody).replace(/\n/g, '<br/>')}<hr/><h4>Original message</h4><div>${escapeHtml(originalMessage).replace(/\n/g, '<br/>')}</div></div>`
  return { text, html }
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

module.exports = { sendMail, contactNotificationTemplate, replyTemplate }
