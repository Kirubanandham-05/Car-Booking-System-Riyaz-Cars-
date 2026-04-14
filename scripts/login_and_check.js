// Usage: node scripts/login_and_check.js <email> <password>
// Logs in and calls /api/auth/me, printing status and bodies.

const email = process.argv[2] || 'admin@riyazcars.com'
const password = process.argv[3] || 'kiruba'

;(async () => {
  try {
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const loginText = await loginRes.text()
    console.log('LOGIN STATUS', loginRes.status)
    try { console.log('LOGIN BODY', JSON.parse(loginText)) } catch(e) { console.log('LOGIN BODY', loginText) }

    if (!loginRes.ok) process.exit(2)
    const loginJson = JSON.parse(loginText)
    const token = loginJson.token

    const meRes = await fetch('http://127.0.0.1:3000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const meText = await meRes.text()
    console.log('ME STATUS', meRes.status)
    try { console.log('ME BODY', JSON.parse(meText)) } catch(e) { console.log('ME BODY', meText) }

  } catch (err) {
    console.error('Request error:', err)
    process.exit(1)
  }
})()
