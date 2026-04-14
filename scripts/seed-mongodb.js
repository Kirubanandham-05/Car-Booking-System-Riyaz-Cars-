require("dotenv").config()
const bcrypt = require("bcryptjs")
const { MongoClient } = require("mongodb")

async function seed() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME || "riyaz_cars"

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env")
  }

  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)
    const users = db.collection("users")
    const cars = db.collection("cars")

    const adminEmail = "admin@riyazcars.com"
    const adminPassword = "kiruba"
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    await users.updateOne(
      { email: adminEmail },
      {
        $setOnInsert: {
          email: adminEmail,
          password: passwordHash,
          name: "Admin",
          phone: "1234567890",
          role: "admin",
          avatar_url: null,
          address: null,
          created_at: new Date(),
        },
      },
      { upsert: true },
    )

    const carDocs = [
      {
        name: "Toyota Innova Crysta",
        type: "SUV",
        seats: 7,
        price_per_day: 2500,
        image_url: "/toyota-innova-crysta-white.jpg",
        available: true,
        created_at: new Date(),
      },
      {
        name: "Honda City",
        type: "Sedan",
        seats: 5,
        price_per_day: 1800,
        image_url: "/honda-city-silver.jpg",
        available: true,
        created_at: new Date(),
      },
    ]

    for (const car of carDocs) {
      await cars.updateOne(
        { name: car.name },
        { $setOnInsert: car },
        { upsert: true },
      )
    }

    console.log("MongoDB seed completed")
    console.log(`DB: ${dbName}`)
    console.log(`Admin: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
  } finally {
    await client.close()
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
