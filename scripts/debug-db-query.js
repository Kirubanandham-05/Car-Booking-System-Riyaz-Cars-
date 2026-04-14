const db = require('../server/db')

;(async () => {
  try {
    const id = 9
    console.log('Querying user id', id)
    const result = await db.query('SELECT id, email, name, phone, role, created_at, avatar_url, address FROM users WHERE id = $1', [id])
    console.log('Result rows type:', typeof result.rows)
    console.log('Result rows length:', result.rows.length)
    console.log(result.rows[0])
  } catch (err) {
    console.error('DB query error:', err)
    process.exit(1)
  }
})()
