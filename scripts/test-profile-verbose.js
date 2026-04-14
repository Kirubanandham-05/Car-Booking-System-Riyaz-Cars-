const crypto = require('crypto')

a = async ()=>{
  try{
    const id = crypto.randomBytes(4).toString('hex')
    const email = `temp+${id}@example.com`
    const password = `Passw0rd!${id}`
    const name = 'Temp User'
    const phone = '9000000000'
    const API = `http://127.0.0.1:${process.env.PORT || 3000}/api`

    console.log('Signing up', email)
    const signupRes = await fetch(`${API}/auth/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password, name, phone }) })
    console.log('signup status', signupRes.status)
    const signupText = await signupRes.text()
    console.log('signup body', signupText)

    const loginRes = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
    console.log('login status', loginRes.status)
    const loginText = await loginRes.text()
    console.log('login body', loginText)
    if (!loginRes.ok) throw new Error('login failed')
    const loginJson = JSON.parse(loginText)
    const token = loginJson.token
    console.log('token:', token)

    const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    console.log('me status', meRes.status)
    const meText = await meRes.text()
    console.log('me body', meText)

  }catch(e){
    console.error('error', e.message || e)
    process.exit(1)
  }
}

a()
