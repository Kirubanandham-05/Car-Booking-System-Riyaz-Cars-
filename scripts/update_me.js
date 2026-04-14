// Usage:
// node scripts/update_me.js <token> '{"password":"newpass"}'
// or set env TOKEN and run:
// TOKEN=<token> node scripts/update_me.js '{"password":"newpass"}'

const token = process.argv[2] || process.env.TOKEN
const payloadArg = process.argv[3]

if (!token || !payloadArg) {
  console.error('Usage: node scripts/update_me.js <token> <json-payload>')
  console.error('Example: node scripts/update_me.js <token> "{\"password\":\"kiruba\"}"')
  process.exit(2)
}

let payload
try {
  payload = JSON.parse(payloadArg)
} catch (err) {
  console.error('Invalid JSON payload:', err.message)
  process.exit(2)
}

;(async () => {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/auth/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    console.log('STATUS', res.status)
    console.log('HEADERS', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2))
    console.log('BODY:')
    console.log(text)
    if (res.ok) process.exit(0)
    process.exit(1)
  } catch (err) {
    console.error('Request failed:', err)
    process.exit(1)
  }
})()
