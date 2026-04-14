// Usage: node scripts/set-admin-password.js <new-password> [email]
// Example: node scripts/set-admin-password.js kiruba admin@riyazcars.com

require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('../server/db')

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node scripts/set-admin-password.js <new-password> [email]')
    process.exit(2)
  }
  const newPassword = args[0]
  const email = args[1] || 'admin@riyazcars.com'

  try {
    const hashed = await bcrypt.hash(newPassword, 10)
    const res = await db.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email', [hashed, email])
    if (!res || !res.rows || res.rows.length === 0) {
      console.error('No user updated. Is the email correct?')
      process.exit(3)
    }
    console.log('Updated password for:', res.rows[0])
    process.exit(0)
  } catch (err) {
    console.error('Failed to update admin password:', err.message || err)
    process.exit(1)
  }
}

main()
