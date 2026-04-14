(async () => {
  const base = 'http://localhost:3000/api'
  try {
    console.log('Signup...')
    let res = await fetch(`${base}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Smoke Tester`, email: `smoketest+${Date.now()}@example.com`, phone: '9999999999', password: 'Password123' }),
    })
    let data
    try { data = await res.json() } catch (e) { data = null }
    console.log('Signup ->', res.status, data)

    console.log('Login...')
    const signupEmail = data && data.user && data.user.email ? data.user.email : 'smoketest@example.com'
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupEmail, password: 'Password123' }),
    })
    data = await res.json()
    console.log('Login ->', res.status, data)

    if (!data || !data.token) throw new Error('Login did not return token')
    const token = data.token
    const headers = { Authorization: `Bearer ${token}` }

    console.log('Get cars...')
    res = await fetch(`${base}/cars`, { headers })
    const cars = await res.json()
    console.log('Cars ->', res.status, cars)

    if (!Array.isArray(cars) || cars.length === 0) throw new Error('No cars available for booking')
    const car = cars[0]

    console.log('Create booking...')
    const pickup = new Date().toISOString().slice(0, 10)
    const dropoff = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const body = {
      car_id: car.id,
      pickup_location: 'Location A',
      dropoff_location: 'Location B',
      pickup_date: pickup,
      dropoff_date: dropoff,
      total_days: 2,
      total_price: ((car.price_per_day || car.price || 100) * 2),
    }

    res = await fetch(`${base}/bookings`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const booking = await res.json()
    console.log('Booking ->', res.status, booking)

    console.log('Smoke tests passed')
    process.exit(0)
  } catch (err) {
    console.error('Smoke test failed:', err)
    process.exit(1)
  }
})()
