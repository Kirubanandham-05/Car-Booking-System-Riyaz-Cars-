const dotenv = require('dotenv')
dotenv.config()
const API = `http://127.0.0.1:${process.env.PORT || 3000}/api`

async function run(){
  const email = process.env.DEBUG_EMAIL
  const password = process.env.DEBUG_PASSWORD
  if(!email || !password){
    console.error('Set DEBUG_EMAIL and DEBUG_PASSWORD in .env to use this script')
    process.exit(1)
  }
  const loginRes = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) })
  const loginText = await loginRes.text()
  console.log('LOGIN status', loginRes.status, loginText)
  if(!loginRes.ok) process.exit(1)
  const loginJson = JSON.parse(loginText)
  const token = loginJson.token
  const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  const meText = await meRes.text()
  console.log('ME status', meRes.status, meText)
}
run().catch(e=>{console.error(e); process.exit(1)})
