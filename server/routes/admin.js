const express = require("express")
const db = require("../db")
const { authenticateToken, isAdmin } = require("../middleware/auth")

const router = express.Router()

// Get all bookings
router.get("/bookings", authenticateToken, isAdmin, async (req, res) => {
  try {
    const database = db.getDb()
    const bookingsCol = database.collection("bookings")
    const carsCol = database.collection("cars")
    const usersCol = database.collection("users")

    const bookings = await bookingsCol.find({}).sort({ created_at: -1 }).toArray()

    const carIds = bookings.map((booking) => db.toObjectId(booking.car_id)).filter(Boolean)
    const userIds = bookings.map((booking) => db.toObjectId(booking.user_id)).filter(Boolean)

    const [cars, users] = await Promise.all([
      carsCol.find({ _id: { $in: carIds } }).toArray(),
      usersCol.find({ _id: { $in: userIds } }).toArray(),
    ])

    const carMap = new Map(cars.map((car) => [car._id.toString(), car]))
    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    const rows = bookings.map((booking) => {
      const car = carMap.get(String(booking.car_id))
      const user = userMap.get(String(booking.user_id))
      return {
        ...db.withId(booking),
        car_name: car ? car.name : null,
        car_type: car ? car.type : null,
        user_name: user ? user.name : null,
        user_email: user ? user.email : null,
        user_phone: user ? user.phone : null,
      }
    })

    res.json(rows)
  } catch (error) {
    console.error("Get all bookings error:", error)
    res.status(500).json({ error: "Failed to fetch bookings" })
  }
})

// Update booking status
router.patch("/bookings/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Booking not found" })

    const bookings = db.getDb().collection("bookings")
    const updateResult = await bookings.updateOne({ _id: objectId }, { $set: { status } })

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Booking not found" })
    }

    const booking = await bookings.findOne({ _id: objectId })
    res.json(db.withId(booking))
  } catch (error) {
    console.error("Update booking error:", error)
    res.status(500).json({ error: "Failed to update booking" })
  }
})

// Update car availability
router.patch("/cars/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { available } = req.body

    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Car not found" })

    const cars = db.getDb().collection("cars")
    const updateResult = await cars.updateOne({ _id: objectId }, { $set: { available: Boolean(available) } })

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Car not found" })
    }

    const car = await cars.findOne({ _id: objectId })
    res.json(db.withId(car))
  } catch (error) {
    console.error("Update car error:", error)
    res.status(500).json({ error: "Failed to update car" })
  }
})

// Create a new car (admin only)
router.post("/cars", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, type, seats, price_per_day, image_url, available } = req.body

    if (!name || !type || !seats || !price_per_day) {
      return res.status(400).json({ error: "Missing required car fields" })
    }

    const seatsInt = parseInt(seats, 10)
    const priceFloat = parseFloat(price_per_day)

    const payload = {
      name,
      type,
      seats: seatsInt,
      price_per_day: priceFloat,
      image_url: image_url || null,
      available: available === undefined ? true : Boolean(available),
      created_at: new Date(),
    }

    const cars = db.getDb().collection("cars")
    const insertResult = await cars.insertOne(payload)

    res.status(201).json({ id: insertResult.insertedId.toString(), ...payload })
  } catch (error) {
    console.error("Create car error:", error)
    res.status(500).json({ error: "Failed to create car" })
  }
})

// Get statistics
router.get("/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = db.getDb().collection("bookings")

    const [totalBookings, pendingBookings, approvedBookings, approvedRows] = await Promise.all([
      bookings.countDocuments({}),
      bookings.countDocuments({ status: "pending" }),
      bookings.countDocuments({ status: "approved" }),
      bookings.find({ status: "approved" }, { projection: { total_price: 1 } }).toArray(),
    ])

    const totalRevenue = approvedRows.reduce((sum, row) => sum + Number(row.total_price || 0), 0)

    res.json({
      totalBookings,
      pendingBookings,
      approvedBookings,
      totalRevenue,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

// Admin: messages endpoints
router.get("/messages", authenticateToken, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10))
    const limit = Math.min(100, parseInt(req.query.limit || "20", 10))
    const offset = (page - 1) * limit

    const database = db.getDb()
    const messagesCol = database.collection("messages")
    const usersCol = database.collection("users")

    const rows = await messagesCol.find({}).sort({ created_at: -1 }).skip(offset).limit(limit).toArray()
    const senderIds = rows.map((row) => db.toObjectId(row.sender_id)).filter(Boolean)
    const users = await usersCol.find({ _id: { $in: senderIds } }).toArray()
    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    const payloadRows = rows.map((row) => {
      const sender = userMap.get(String(row.sender_id))
      const normalized = db.withId(row)
      return {
        ...normalized,
        sender_name: sender ? sender.name : normalized.sender_name,
        sender_email: sender ? sender.email : normalized.sender_email,
      }
    })

    const total = await messagesCol.countDocuments({})
    res.json({ ok: true, page, limit, total, rows: payloadRows })
  } catch (err) {
    console.error("Admin get messages error:", err)
    res.status(500).json({ error: "Failed to fetch messages" })
  }
})

router.get("/messages/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Message not found" })

    const database = db.getDb()
    const messagesCol = database.collection("messages")
    const usersCol = database.collection("users")

    const row = await messagesCol.findOne({ _id: objectId })
    if (!row) return res.status(404).json({ error: "Message not found" })

    const sender = row.sender_id ? await usersCol.findOne({ _id: db.toObjectId(row.sender_id) }) : null
    const normalized = db.withId(row)

    res.json({
      ok: true,
      row: {
        ...normalized,
        sender_name: sender ? sender.name : normalized.sender_name,
        sender_email: sender ? sender.email : normalized.sender_email,
      },
    })
  } catch (err) {
    console.error("Admin get message error:", err)
    res.status(500).json({ error: "Failed to fetch message" })
  }
})

// Mark message as read
router.patch("/messages/:id/read", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Message not found" })

    const messages = db.getDb().collection("messages")
    const updateResult = await messages.updateOne({ _id: objectId }, { $set: { is_read: true } })
    if (updateResult.matchedCount === 0) return res.status(404).json({ error: "Message not found" })

    const row = await messages.findOne({ _id: objectId })
    res.json({ ok: true, row: db.withId(row) })
  } catch (err) {
    console.error("Mark read error:", err)
    res.status(500).json({ error: "Failed to mark read" })
  }
})

// Reply to message: send email to sender email (if available)
router.post("/messages/:id/reply", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { reply } = req.body
    if (!reply || !reply.trim()) return res.status(400).json({ error: "Reply body required" })

    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Message not found" })

    const database = db.getDb()
    const messagesCol = database.collection("messages")
    const usersCol = database.collection("users")

    const msg = await messagesCol.findOne({ _id: objectId })
    if (!msg) return res.status(404).json({ error: "Message not found" })

    // Try to find sender email from registered user first, then fall back to stored sender_email.
    let toEmail = null
    if (msg.sender_id) {
      const senderObjectId = db.toObjectId(msg.sender_id)
      if (senderObjectId) {
        const senderUser = await usersCol.findOne({ _id: senderObjectId }, { projection: { email: 1 } })
        if (senderUser) toEmail = senderUser.email
      }
    }
    if (!toEmail && msg.sender_email) toEmail = msg.sender_email

    if (!toEmail) return res.status(400).json({ error: "Sender email not found; cannot send reply" })

    const { replyTemplate } = require("../lib/email")
    const tpl = replyTemplate({ replyBody: reply, originalMessage: msg.body })
    const emailLib = require("../lib/email")
    const sendRes = await emailLib.sendMail({
      to: toEmail,
      subject: `Reply: ${msg.subject || "Your message"}`,
      text: tpl.text,
      html: tpl.html,
    })

    if (!sendRes.ok) {
      console.warn("Reply email not sent (SMTP may be unconfigured):", sendRes.error || sendRes)
      return res.json({ ok: true, note: "reply-not-sent" })
    }

    const out = { ok: true }
    if (sendRes.preview) out.preview = sendRes.preview
    res.json(out)
  } catch (err) {
    console.error("Admin reply error:", err)
    res.status(500).json({ error: "Failed to send reply" })
  }
})

// Retry sending stored message to owner (admin only)
router.post("/messages/:id/send", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Message not found" })

    const database = db.getDb()
    const messagesCol = database.collection("messages")
    const usersCol = database.collection("users")

    const msg = await messagesCol.findOne({ _id: objectId })
    if (!msg) return res.status(404).json({ error: "Message not found" })

    // determine owner email
    let ownerEmail = process.env.OWNER_EMAIL || null
    if (msg.owner_id) {
      const owner = await usersCol.findOne({ _id: db.toObjectId(msg.owner_id) }, { projection: { email: 1 } })
      if (owner) ownerEmail = owner.email || ownerEmail
    }

    // If still no ownerEmail, fall back to configured OWNER_EMAIL or admin user email
    if (!ownerEmail) {
      if (process.env.OWNER_EMAIL) ownerEmail = process.env.OWNER_EMAIL
      else {
        const adminUser = await usersCol.findOne({ role: "admin" }, { projection: { email: 1 } })
        if (adminUser) ownerEmail = adminUser.email
      }
    }

    if (!ownerEmail) return res.status(400).json({ error: "Owner email not found" })

    const emailLib = require("../lib/email")
    const tpl = emailLib.contactNotificationTemplate({ ownerEmail, subject: msg.subject, body: msg.body, sender: null })
    const sendRes = await emailLib.sendMail({ to: ownerEmail, subject: msg.subject || "New message", text: tpl.text, html: tpl.html })

    if (sendRes.ok) {
      try {
        await messagesCol.updateOne({ _id: objectId }, { $set: { sent_email: true } })
      } catch (e) {
        console.error("Failed to mark sent_email", e)
      }
      const out = { ok: true }
      if (sendRes.preview) out.preview = sendRes.preview
      return res.json(out)
    }

    res.status(500).json({ ok: false, error: "Failed to send" })
  } catch (err) {
    console.error("Admin send message error:", err)
    res.status(500).json({ error: "Failed to send message" })
  }
})

// Bulk retry unsent messages
router.post("/messages/send_unsent", authenticateToken, isAdmin, async (req, res) => {
  try {
    const database = db.getDb()
    const messagesCol = database.collection("messages")
    const usersCol = database.collection("users")

    const unsent = await messagesCol.find({ sent_email: false }).toArray()
    const results = []
    const emailLib = require("../lib/email")

    for (const msg of unsent) {
      let ownerEmail = process.env.OWNER_EMAIL || null
      if (msg.owner_id) {
        const owner = await usersCol.findOne({ _id: db.toObjectId(msg.owner_id) }, { projection: { email: 1 } })
        if (owner) ownerEmail = owner.email || ownerEmail
      }

      if (!ownerEmail) {
        results.push({ id: msg._id.toString(), ok: false, reason: "no-owner-email" })
        continue
      }

      const tpl = emailLib.contactNotificationTemplate({ ownerEmail, subject: msg.subject, body: msg.body, sender: null })
      const sendRes = await emailLib.sendMail({ to: ownerEmail, subject: msg.subject || "New message", text: tpl.text, html: tpl.html })
      if (sendRes.ok) {
        try {
          await messagesCol.updateOne({ _id: msg._id }, { $set: { sent_email: true } })
        } catch (e) {
          console.error("Failed to mark sent_email", e)
        }
        results.push({ id: msg._id.toString(), ok: true, preview: sendRes.preview || null })
      } else {
        results.push({ id: msg._id.toString(), ok: false })
      }
    }

    res.json({ ok: true, results })
  } catch (err) {
    console.error("Bulk send unsent error:", err)
    res.status(500).json({ error: "Failed to process unsent messages" })
  }
})

module.exports = router
