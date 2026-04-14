const API_URL = "/api"

// Tab switching
const loginTab = document.getElementById("loginTab")
const signupTab = document.getElementById("signupTab")
const loginForm = document.getElementById("loginForm")
const signupForm = document.getElementById("signupForm")
const errorMessage = document.getElementById("errorMessage")

loginTab.addEventListener("click", () => {
  loginTab.classList.add("bg-blue-600", "text-white")
  loginTab.classList.remove("bg-slate-100", "text-slate-600")
  signupTab.classList.remove("bg-blue-600", "text-white")
  signupTab.classList.add("bg-slate-100", "text-slate-600")
  loginForm.classList.remove("hidden")
  signupForm.classList.add("hidden")
  errorMessage.classList.add("hidden")
})

signupTab.addEventListener("click", () => {
  signupTab.classList.add("bg-blue-600", "text-white")
  signupTab.classList.remove("bg-slate-100", "text-slate-600")
  loginTab.classList.remove("bg-blue-600", "text-white")
  loginTab.classList.add("bg-slate-100", "text-slate-600")
  signupForm.classList.remove("hidden")
  loginForm.classList.add("hidden")
  errorMessage.classList.add("hidden")
})

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  errorMessage.classList.add("hidden")

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Login failed")
    }

    // Store token and user
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    // Redirect based on role
    if (data.user.role === "admin") {
      window.location.href = "/admin"
    } else {
      window.location.href = "/dashboard"
    }
  } catch (error) {
    errorMessage.textContent = error.message
    errorMessage.classList.remove("hidden")
  }
})

// Signup
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  errorMessage.classList.add("hidden")

  const name = document.getElementById("signupName").value
  const email = document.getElementById("signupEmail").value
  const phone = document.getElementById("signupPhone").value
  const password = document.getElementById("signupPassword").value

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Signup failed")
    }

    // Store token and user
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    // Redirect to dashboard
    window.location.href = "/dashboard"
  } catch (error) {
    errorMessage.textContent = error.message
    errorMessage.classList.remove("hidden")
  }
})

// Check if already logged in
const token = localStorage.getItem("token")
const user = localStorage.getItem("user")

// Only auto-redirect when the user is NOT landing on the public home page.
// This prevents the site from immediately navigating away from the homepage
// (for example to /admin) when a token exists in localStorage.
if (token && user) {
  try {
    const userData = JSON.parse(user)
    const path = window.location.pathname || '/'
    const isHome = path === '/' || path === '/index.html'
    if (!isHome) {
      if (userData.role === 'admin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    }
  } catch (e) {
    // ignore parse errors and do not redirect
  }
}
