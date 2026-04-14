(async () => {
  require('dotenv').config()
  try {
    const db = require('../server/db')
    const res = await db.query('SELECT 1')
    console.log('DB check OK:', res)
    process.exit(0)
  } catch (err) {
    console.error('DB check failed:', err.message)
    process.exit(1)
  }
})()
