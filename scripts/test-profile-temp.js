const crypto = require('crypto')

const API = `http://127.0.0.1:${process.env.PORT || 3000}/api`

async function signup(email, password, name, phone) {
  const res = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, phone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Signup failed')
  return data
}

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data
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
    const id = crypto.randomBytes(4).toString('hex')
    const email = `temp+${id}@example.com`
    const password = `Passw0rd!${id}`
    const name = 'Temp User'
    const phone = '9000000000'

    console.log('Signing up', email)
    const signupRes = await signup(email, password, name, phone)
    console.log('Signup success:', signupRes.user.email)

    const loginRes = await login(email, password)
    console.log('Login token length:', loginRes.token.length)

    const profile = await me(loginRes.token)
    console.log('Profile before:', profile)

    const updated = await updateMe(loginRes.token, { name: 'Updated ' + id, address: 'Test address' })
    console.log('Updated:', updated)

    const profile2 = await me(loginRes.token)
    console.log('Profile after:', profile2)

    console.log('Temp profile test completed successfully')
  } catch (err) {
    console.error('Temp test failed:', err.message || err)
    process.exit(1)
  }
})()
