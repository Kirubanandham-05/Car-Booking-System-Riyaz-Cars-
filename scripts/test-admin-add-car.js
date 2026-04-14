const dotenv = require('dotenv')

dotenv.config()

const API = `http://127.0.0.1:${process.env.PORT || 3000}/api`

async function loginAdmin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@riyazcars.com', password: process.env.ADMIN_PASSWORD || '' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data.token
}

async function addCar(token) {
  const res = await fetch(`${API}/admin/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test Car', type: 'Sedan', seats: 4, price_per_day: 1499.99, image_url: '', available: true }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Add car failed')
  return data
}

;(async () => {
  try {
    const token = await loginAdmin()
    console.log('Logged in, token length:', token.length)
    const car = await addCar(token)
    console.log('Created car:', car)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
})()
