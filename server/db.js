const { MongoClient, ObjectId } = require("mongodb")

let client
let db

async function connect() {
  if (db) return db

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not configured")
  }

  const dbName = process.env.MONGODB_DB_NAME || "riyaz_cars"
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  return db
}

function getDb() {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connect() first.")
  }
  return db
}

function toObjectId(value) {
  if (!value || !ObjectId.isValid(String(value))) return null
  return new ObjectId(String(value))
}

function withId(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest }
}

async function ping() {
  const database = getDb()
  await database.command({ ping: 1 })
  return true
}

module.exports = {
  connect,
  getDb,
  toObjectId,
  withId,
  ping,
}
