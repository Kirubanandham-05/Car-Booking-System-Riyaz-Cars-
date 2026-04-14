// Post a contact message without authentication to verify anonymous sending works
(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default
    const res = await fetch('http://127.0.0.1:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_id: null, subject: 'Anon test', message: 'Hello from anonymous test', sender_name: 'Anon', sender_email: 'anon@example.com' }),
    })
    const txt = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', txt)
  } catch (err) {
    console.error('Error posting anonymous contact:', err)
    process.exit(1)
  }
})()
