/**
 * Test script: login as admin, post a message (optional), fetch admin messages, and reply to the first message
 */
(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default
    const base = 'http://127.0.0.1:3000'

    console.log('Logging in as admin...')
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@riyazcars.com', password: 'kiruba' }),
    })
    const loginJson = await loginRes.json()
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginJson))
    const token = loginJson.token
    console.log('Got token:', token ? '[REDACTED]' : null)

    // Post a contact message as admin user to ensure at least one message exists
    console.log('Posting a test contact message...')
    const postRes = await fetch(base + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ owner_id: null, subject: 'Automated test', message: 'Hello from automated admin test' }),
    })
    const postText = await postRes.text()
    console.log('POST /api/contact ->', postRes.status, postText)

    // Fetch admin messages
    console.log('Fetching admin messages...')
    const msgsRes = await fetch(base + '/api/admin/messages', { headers: { Authorization: 'Bearer ' + token } })
    const msgsJson = await msgsRes.json()
    if (!msgsRes.ok) throw new Error('Failed to list messages: ' + JSON.stringify(msgsJson))
    console.log('Messages list:', JSON.stringify(msgsJson, null, 2))

    if (!msgsJson.rows || msgsJson.rows.length === 0) {
      console.log('No messages to reply to; done.')
      process.exit(0)
    }

    const first = msgsJson.rows[0]
    console.log('Replying to message id', first.id)
    const replyRes = await fetch(base + `/api/admin/messages/${first.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ reply: 'Thanks, we received your message. (automated reply)' }),
    })
    const replyJson = await replyRes.json()
    console.log('Reply response:', replyRes.status, replyJson)

    process.exit(0)
  } catch (err) {
    console.error('Test admin messages error:', err)
    process.exit(1)
  }
})()
