const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")
const db = require("./db")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))

// Import routes
const authRoutes = require("./routes/auth")
const carRoutes = require("./routes/cars")
const bookingRoutes = require("./routes/bookings")
const adminRoutes = require("./routes/admin")
const contactRoutes = require("./routes/contact")

// Use routes
app.use("/api/auth", authRoutes)
app.use("/api/cars", carRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/contact", contactRoutes)

// Health endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.ping()
    res.json({ ok: true, db: true })
  } catch (err) {
    console.error('Health check failed', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"))
})

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"))
})

// Serve profile page at /profile
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/profile.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

let server

async function start() {
  try {
    await db.connect()
    server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })

    server.on('error', (err) => {
      console.error('Server error:', err)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  // optionally exit process after logging
})

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})
