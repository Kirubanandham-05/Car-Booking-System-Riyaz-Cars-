const express = require("express")
const db = require("../db")

const router = express.Router()

// Get all cars
router.get("/", async (req, res) => {
  try {
    const cars = db.getDb().collection("cars")
    const rows = await cars.find({}).sort({ _id: 1 }).toArray()
    res.json(rows.map(db.withId))
  } catch (error) {
    console.error("Get cars error:", error)
    res.status(500).json({ error: "Failed to fetch cars" })
  }
})

// Get car by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const objectId = db.toObjectId(id)
    if (!objectId) return res.status(404).json({ error: "Car not found" })

    const cars = db.getDb().collection("cars")
    const car = await cars.findOne({ _id: objectId })

    if (!car) {
      return res.status(404).json({ error: "Car not found" })
    }

    res.json(db.withId(car))
  } catch (error) {
    console.error("Get car error:", error)
    res.status(500).json({ error: "Failed to fetch car" })
  }
})

module.exports = router
