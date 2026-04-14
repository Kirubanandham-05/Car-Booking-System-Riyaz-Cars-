const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.status(401).json({ error: 'Missing token' })

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' })
    req.user = user
    next()
  })
}

// Optional authentication: if Authorization header present, verify and attach req.user;
// if missing or invalid, proceed without failing (used for public endpoints that optionally accept logged-in users)
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return next()

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err && user) req.user = user
    // always continue regardless of verification result
    next()
  })
}

function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Missing user' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}

module.exports = { authenticateToken, optionalAuthenticate, isAdmin }
