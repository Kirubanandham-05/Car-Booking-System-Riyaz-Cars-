const dotenv = require('dotenv')
dotenv.config()

;(async function main() {
  try {
    const db = require('../server/db')
    console.log('Finding smoke-test users...')
    const usersRes = await db.query("SELECT id, email FROM users WHERE email LIKE 'smoketest%'")
    const users = usersRes.rows
    if (!users.length) {
      console.log('No smoke-test users found.')
      process.exit(0)
    }
    const ids = users.map(u => u.id)
    console.log('Found users:', users.map(u=>u.email))

    // Delete bookings for these users
    const delBookings = await db.query('DELETE FROM bookings WHERE user_id = ANY($1::int[]) RETURNING id', [ids])
    console.log('Deleted bookings:', delBookings.rows.map(r=>r.id))

    // Delete users
    const delUsers = await db.query('DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, email', [ids])
    console.log('Deleted users:', delUsers.rows)

    console.log('Cleanup complete')
    process.exit(0)
  } catch (err) {
    console.error('Cleanup failed:', err)
    process.exit(1)
  }
})()
