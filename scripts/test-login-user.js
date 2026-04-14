const dotenv = require('dotenv')
dotenv.config()

;(async function(){
  try{
    const email = 'kirubanandhamskiruba@gmail.com'
    const password = 'kiruba@18'
  const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const text = await res.text()
    console.log('STATUS:', res.status)
    try{
      console.log('BODY:', JSON.stringify(JSON.parse(text), null, 2))
    }catch(e){
      console.log('BODY (raw):', text)
    }
    process.exit(0)
  }catch(err){
    console.error('Request failed:', err)
    process.exit(1)
  }
})()
