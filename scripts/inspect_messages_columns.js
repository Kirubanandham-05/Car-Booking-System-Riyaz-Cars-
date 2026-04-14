const db = require('../server/db')

async function list() {
  try {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' ORDER BY ordinal_position")
    console.log('messages table columns:')
    console.log(res.rows)
  } catch (e) {
    console.error('inspect error', e)
  } finally {
    process.exit(0)
  }
}

list()
