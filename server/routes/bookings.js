const express = require("express")
const db = require("../db")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Create booking
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { car_id, pickup_location, dropoff_location, pickup_date, dropoff_date, total_days, total_price } = req.body
    const user_id = req.user.id
    const bookings = db.getDb().collection("bookings")

    const payload = {
      user_id: String(user_id),
      car_id: String(car_id),
      pickup_location,
      dropoff_location,
      pickup_date,
      dropoff_date,
      total_days,
      total_price,
      status: "pending",
      created_at: new Date(),
    }

    const result = await bookings.insertOne(payload)

    res.json({ id: result.insertedId.toString(), ...payload })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ error: "Failed to create booking" })
  }
})

// Get user bookings
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id
    const database = db.getDb()
    const bookingsCol = database.collection("bookings")
    const carsCol = database.collection("cars")

    const rows = await bookingsCol.find({ user_id: String(user_id) }).sort({ created_at: -1 }).toArray()

    const carObjectIds = rows
      .map((booking) => db.toObjectId(booking.car_id))
      .filter(Boolean)

    const cars = await carsCol.find({ _id: { $in: carObjectIds } }).toArray()
    const carMap = new Map(cars.map((car) => [car._id.toString(), car]))

    const enriched = rows.map((booking) => {
      const car = carMap.get(String(booking.car_id))
      return {
        ...db.withId(booking),
        car_name: car ? car.name : null,
        car_type: car ? car.type : null,
        car_image: car ? car.image_url : null,
      }
    })

    res.json(enriched)
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({ error: "Failed to fetch bookings" })
  }
})

module.exports = router
