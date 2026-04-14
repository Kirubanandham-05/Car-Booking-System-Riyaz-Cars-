const API_URL = "/api"

// Get auth token
function getToken() {
  return localStorage.getItem("token")
}

// Get current user
function getUser() {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

// Check authentication
function checkAuth() {
  const token = getToken()
  const user = getUser()

  if (!token || !user) {
    window.location.href = "/"
    return false
  }

  return true
}

// Logout
function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/"
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken()

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)
  let data = null
  const text = await response.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = text
  }

  if (!response.ok) {
    const err = new Error(data && data.error ? data.error : `Request failed with status ${response.status}`)
    err.status = response.status
    err.response = data
    throw err
  }

  return data
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format currency
function formatCurrency(amount) {
  return `₹${Number.parseFloat(amount).toLocaleString("en-IN")}`
}

// Calculate days between dates
function calculateDays(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays || 1
}
