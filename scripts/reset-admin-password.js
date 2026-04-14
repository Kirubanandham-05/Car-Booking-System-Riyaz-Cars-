const crypto = require('crypto')
const bcrypt = require('bcryptjs')

require('dotenv').config()

;(async function main() {
  try {
    const db = require('../server/db')
    const email = 'admin@riyazcars.com'

    // Generate a secure random password (base64url, ~16 chars)
    const password = crypto.randomBytes(12).toString('base64url')

    // Hash password
    const hashed = await bcrypt.hash(password, 10)

    // Update DB
    const res = await db.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email', [hashed, email])
    if (!res.rows || res.rows.length === 0) {
      console.error('No user found with email', email)
      process.exit(2)
    }

    console.log('Admin password updated for', res.rows[0].email)
    console.log('New password (store this safely):')
    console.log(password)
    process.exit(0)
  } catch (err) {
    console.error('Failed to reset admin password:', err.message || err)
    process.exit(1)
  }
})()
