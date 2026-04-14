(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default
    // login
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@riyazcars.com', password: 'kiruba' }),
    })
    const loginJson = await loginRes.json()
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginJson))
    const token = loginJson.token
    console.log('Got token, posting contact...')
    const contactRes = await fetch('http://127.0.0.1:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ owner_id: null, subject: 'Test message', message: 'Hello from test script' }),
    })
  const contactText = await contactRes.text()
  console.log('Contact response status:', contactRes.status)
  console.log('Contact response body:', contactText)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
