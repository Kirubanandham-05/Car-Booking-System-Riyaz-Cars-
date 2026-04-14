require('dotenv').config()
const { sendMail } = require('../server/lib/email')

async function main() {
  try {
    const to = process.argv[2] || process.env.TEST_EMAIL_TO || process.env.OWNER_EMAIL
    if (!to) {
      console.error('No recipient provided. Usage: node send_test_email.js recipient@example.com')
      process.exit(2)
    }

    console.log('Attempting to send test email to', to)
    const res = await sendMail({ to, subject: 'Test email from Riyaz-cars', text: 'This is a test email from your local Riyaz-cars app.' })
    console.log('sendMail result:', res)
    if (!res.ok) process.exit(1)
    process.exit(0)
  } catch (err) {
    console.error('send_test_email error:', err)
    process.exit(1)
  }
}

main()
