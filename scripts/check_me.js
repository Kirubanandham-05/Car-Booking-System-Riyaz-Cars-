// Usage: node scripts/check_me.js <token>
// or set env TOKEN and run: node scripts/check_me.js

const token = process.argv[2] || process.env.TOKEN
if (!token) {
  console.error('Usage: node scripts/check_me.js <token> (or set env TOKEN)')
  process.exit(2)
}

;(async () => {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const text = await res.text()
    console.log('STATUS', res.status)
    console.log('HEADERS', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2))
    console.log('BODY:')
    console.log(text)
  } catch (err) {
    console.error('Fetch error:', err)
    process.exit(1)
  }
})()
