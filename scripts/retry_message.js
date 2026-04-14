/**
 * Retry sending a stored message by id (admin)
 */
(async function(){
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default
    const base = 'http://127.0.0.1:3000'
    const id = process.argv[2] || '4'
    console.log('Logging in...')
    const loginRes = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@riyazcars.com', password: 'kiruba' }) })
    const loginJson = await loginRes.json()
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginJson))
    const token = loginJson.token
    console.log('Calling retry send for message', id)
    const res = await fetch(base + `/api/admin/messages/${id}/send`, { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
  const txt = await res.text()
  let parsed = txt
  try { parsed = JSON.parse(txt) } catch (e) { /* keep text */ }
  console.log('Retry response:', res.status, parsed)
  } catch (err) {
    console.error('retry_message error:', err)
    process.exit(1)
  }
})();
