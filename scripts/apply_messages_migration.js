require('dotenv').config()
const fs = require('fs')
const path = require('path')
const db = require('../server/db')

async function main() {
  const sqlPath = path.join(__dirname, '03-create-messages-table.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  try {
    const res = await db.query(sql)
    console.log('Messages migration applied:', res)
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err.message || err)
    process.exit(1)
  }
}

main()
