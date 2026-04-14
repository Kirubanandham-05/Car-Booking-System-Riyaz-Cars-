require('dotenv').config()
const db = require('../server/db')

;(async () => {
  try {
    const res = await db.query('SELECT id, email, name, role FROM users ORDER BY id')
    console.log('users:', res.rows)
  } catch (err) {
    console.error('list_users error:', err)
  }
})()
