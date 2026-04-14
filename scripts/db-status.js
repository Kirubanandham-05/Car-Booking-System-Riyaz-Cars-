require('dotenv').config()
;(async function(){
  try{
    const db = require('../server/db')
    console.log('Checking DB connectivity and table counts...')
    const users = await db.query('SELECT COUNT(*) AS count FROM users')
    const cars = await db.query('SELECT COUNT(*) AS count FROM cars')
    const bookings = await db.query('SELECT COUNT(*) AS count FROM bookings')
    console.log('users:', users.rows[0].count)
    console.log('cars:', cars.rows[0].count)
    console.log('bookings:', bookings.rows[0].count)
    process.exit(0)
  }catch(err){
    console.error('DB status failed:', err.message || err)
    process.exit(1)
  }
})()
