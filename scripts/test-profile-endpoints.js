const dotenv = require('dotenv')

dotenv.config()

const API = `http://127.0.0.1:${process.env.PORT || 3000}/api`

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data.token
}

async function me(token) {
  const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Me failed')
  return data
}

async function updateMe(token, payload) {
  const res = await fetch(`${API}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Update failed')
  return data
}

;(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@riyazcars.com'
    const password = process.env.ADMIN_PASSWORD || ''
    if (!password) throw new Error('Set ADMIN_PASSWORD in .env for this test')

    const token = await login(email, password)
    console.log('Logged in; token length:', token.length)

    const profile = await me(token)
    console.log('Profile before:', profile)

    const updated = await updateMe(token, { name: 'Test Name ' + Date.now().toString().slice(-4), phone: '9999999999' })
    console.log('Updated:', updated)

    const profile2 = await me(token)
    console.log('Profile after:', profile2)

    console.log('Profile endpoints test completed successfully')
  } catch (err) {
    console.error('Test failed:', err.message || err)
    process.exit(1)
  }
})()
