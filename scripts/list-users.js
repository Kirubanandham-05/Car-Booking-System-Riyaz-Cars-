require('dotenv').config()
;(async function(){
  try{
    const db = require('../server/db')
    const res = await db.query("SELECT id, email, name, phone, role, created_at FROM users ORDER BY id")
    console.log(JSON.stringify(res.rows, null, 2))
    process.exit(0)
  }catch(err){
    console.error('Failed to list users:', err.message || err)
    process.exit(1)
  }
})()
