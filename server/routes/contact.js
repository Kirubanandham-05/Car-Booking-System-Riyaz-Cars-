const express = require('express')
const rateLimit = require('express-rate-limit')
const db = require('../db')
const { optionalAuthenticate } = require('../middleware/auth')
const { sendMail, contactNotificationTemplate } = require('../lib/email')

const router = express.Router()

// Basic rate limiter for contact endpoint to reduce spam
const contactLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 6, // limit each IP to 6 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

// Log when a client is rate-limited to help debugging client-side failures
contactLimiter.handler = (req, res /*next*/) => {
  try { console.warn('[CONTACT] rate-limited', { ip: req.ip, path: req.originalUrl }) } catch (e) {}
  res.status(429).json({ error: 'Too many requests, please wait a moment and try again.' })
}

// POST /api/contact
router.post('/', contactLimiter, optionalAuthenticate, async (req, res) => {
  try {
  const sender_id = req.user && req.user.id ? req.user.id : null
  // Log incoming contact attempts for debugging client-side issues
  try { console.log('[CONTACT] incoming', { sender_id, body: req.body, ip: req.ip }) } catch (e) {}
  // Allow guest senders to include name/email in body
  let { owner_id = null, subject = null, message, recaptchaToken = null, sender_name = null, sender_email = null } = req.body
    // defensive coercion: clients may send the string "null" or a numeric string; convert to integer or real null
    try {
      if (owner_id === 'null' || owner_id === '') owner_id = null
      else if (typeof owner_id === 'string') owner_id = owner_id.trim() || null
    } catch (e) {
      owner_id = null
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Optional reCAPTCHA verification if secret is configured
    if (process.env.RECAPTCHA_SECRET) {
      try {
        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken || '')}`,
        })
        const j = await resp.json()
        if (!j.success) {
          return res.status(400).json({ error: 'reCAPTCHA verification failed' })
        }
      } catch (recapErr) {
        console.error('reCAPTCHA verify error:', recapErr)
        return res.status(500).json({ error: 'Failed to verify reCAPTCHA' })
      }
    }

    const database = db.getDb()
    const messagesCol = database.collection('messages')
    const usersCol = database.collection('users')

    // insert into messages collection
    const payload = {
      owner_id: owner_id ? String(owner_id) : null,
      sender_id: sender_id ? String(sender_id) : null,
      sender_name,
      sender_email,
      subject,
      body: message,
      sent_email: false,
      is_read: false,
      created_at: new Date(),
    }

    const result = await messagesCol.insertOne(payload)

    // If owner_id is provided and SMTP is configured, attempt to send email to owner.
    // If owner_id is null (user contacting site/admin), we do NOT send email — admin will see messages in the admin UI.
    try {
      if (owner_id && process.env.SMTP_HOST) {
        // find owner email if owner_id provided
        let ownerEmail = process.env.OWNER_EMAIL || null
        let ownerName = null
        const ownerRes = await usersCol.findOne(
          { _id: db.toObjectId(owner_id) },
          { projection: { email: 1, name: 1 } },
        )
        if (ownerRes) {
          ownerEmail = ownerRes.email || ownerEmail
          ownerName = ownerRes.name || ownerName
        }

        if (ownerEmail) {
          const sender = sender_id
            ? await usersCol.findOne(
                { _id: db.toObjectId(sender_id) },
                { projection: { name: 1, email: 1 } },
              )
            : null
          const tpl = contactNotificationTemplate({ ownerName, ownerEmail, subject, body: message, sender })
          await sendMail({ to: ownerEmail, subject: subject || 'New message from user', text: tpl.text, html: tpl.html })
          // optionally update sent_email flag - best-effort: ignore DB errors
          try {
            await messagesCol.updateOne({ _id: result.insertedId }, { $set: { sent_email: true } })
          } catch (e) {
            console.error('failed to mark sent_email on message:', e)
          }
        }
      }
    } catch (mailErr) {
      console.error('Failed to send notification email:', mailErr)
    }

    res.json({ ok: true, id: result.insertedId.toString() })
  } catch (err) {
    console.error('Contact route error:', err)
    // In development show the underlying error message to help debug client-side failures.
    // This is safe for local development but you may want to hide details in production.
    const msg = err && err.message ? err.message : 'Failed to send message'
    res.status(500).json({ error: msg })
  }
})

module.exports = router
