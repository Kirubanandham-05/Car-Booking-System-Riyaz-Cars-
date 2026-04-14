const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("../db")

const router = express.Router()
const { authenticateToken } = require('../middleware/auth')

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body
    const users = db.getDb().collection("users")

    // Check if user exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const insertResult = await users.insertOne({
      email,
      password: hashedPassword,
      name,
      phone,
      role: "user",
      avatar_url: null,
      address: null,
      created_at: new Date(),
    })

    const user = {
      id: insertResult.insertedId.toString(),
      email,
      name,
      phone,
      role: "user",
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    res.json({ user, token })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Failed to create account" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const users = db.getDb().collection("users")

    // Find user
    const user = await users.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    const userWithoutPassword = db.withId({
      ...user,
      password: undefined,
    })
    delete userWithoutPassword.password

    res.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Failed to login" })
  }
})

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Helpful debug output for troubleshooting token/db issues
    console.log('GET /api/auth/me called; token payload =', req.user)

    if (!req.user || !req.user.id) {
      console.error('GET /api/auth/me - invalid token payload:', req.user)
      return res.status(400).json({ error: 'Invalid token payload' })
    }
    const users = db.getDb().collection('users')
    const objectId = db.toObjectId(req.user.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid user id' })

    const user = await users.findOne(
      { _id: objectId },
      { projection: { password: 0 } },
    )

    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(db.withId(user))
  } catch (err) {
    console.error('Get profile error:', err)
    // In development, include the error message to help debugging. Do not expose in production.
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: 'Failed to fetch profile', details: err.message })
    }
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update current user profile
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { name, phone, password, email } = req.body

    // Validate basic inputs
    if (email !== undefined && typeof email === 'string' && !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' })
    }
    if (password !== undefined && password.length > 0 && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const users = db.getDb().collection('users')
    const objectId = db.toObjectId(req.user.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid user id' })

    // If email is changing, ensure uniqueness
    const updates = {}

    if (email !== undefined) {
      const check = await users.findOne({ email, _id: { $ne: objectId } })
      if (check) {
        return res.status(400).json({ error: 'Email already in use' })
      }
      updates.email = email
    }

    // allow updating avatar_url and address
    if (req.body.avatar_url !== undefined) {
      updates.avatar_url = req.body.avatar_url
    }
    if (req.body.address !== undefined) {
      updates.address = req.body.address
    }

    if (name !== undefined) {
      updates.name = name
    }
    if (phone !== undefined) {
      updates.phone = phone
    }
    if (password !== undefined && password.length > 0) {
      const hashed = await bcrypt.hash(password, 10)
      updates.password = hashed
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' })

    const result = await users.updateOne(
      { _id: objectId },
      { $set: updates },
    )

    if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' })
    const updatedUser = await users.findOne({ _id: objectId }, { projection: { password: 0 } })
    res.json(db.withId(updatedUser))
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

module.exports = router


