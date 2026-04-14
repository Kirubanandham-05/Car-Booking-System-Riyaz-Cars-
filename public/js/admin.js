// This file expects the helper functions from `public/js/utils.js` to be loaded first:
// - apiRequest(endpoint, options)
// - checkAuth()
// - getUser()
// - logout()
// - formatCurrency()
// - formatDate()

// Check authentication and admin role
if (!checkAuth()) {
  throw new Error("Not authenticated")
}

const user = getUser()
if (user.role !== "admin") {
  window.location.href = "/dashboard"
}

const logoutBtn = document.getElementById("logoutBtn")
const bookingsTab = document.getElementById("bookingsTab")
const carsTab = document.getElementById("carsTab")
const inboxTab = document.getElementById('inboxTab')
const inboxSection = document.getElementById('inboxSection')
const inboxBtn = document.getElementById('inboxBtn')
const inboxCountEl = document.getElementById('inboxCount')
const bookingsSection = document.getElementById("bookingsSection")
const carsSection = document.getElementById("carsSection")
const bookingsList = document.getElementById("bookingsList")
const carsList = document.getElementById("carsList")

// Stats elements
const totalBookingsEl = document.getElementById("totalBookings")
const pendingBookingsEl = document.getElementById("pendingBookings")
const approvedBookingsEl = document.getElementById("approvedBookings")
const totalRevenueEl = document.getElementById("totalRevenue")

let bookings = []
let cars = []
let filteredBookings = []

// Logout
logoutBtn.addEventListener("click", logout)

// Tab switching
// Centralized tab activation to avoid inconsistent state that could collapse sections
function activateTab(name) {
  // Reset all tab visuals
  const tabs = [bookingsTab, carsTab, inboxTab]
  tabs.forEach(t => {
    if (!t) return
    t.classList.remove('border-blue-600', 'text-blue-600')
    t.classList.add('border-transparent', 'text-slate-600')
  })

  // Hide all sections
  if (bookingsSection) bookingsSection.classList.add('hidden')
  if (carsSection) carsSection.classList.add('hidden')
  if (inboxSection) inboxSection.classList.add('hidden')

  // Activate the chosen tab
  if (name === 'bookings') {
    bookingsTab.classList.add('border-blue-600', 'text-blue-600')
    bookingsTab.classList.remove('border-transparent', 'text-slate-600')
    if (bookingsSection) bookingsSection.classList.remove('hidden')
  } else if (name === 'cars') {
    carsTab.classList.add('border-blue-600', 'text-blue-600')
    carsTab.classList.remove('border-transparent', 'text-slate-600')
    if (carsSection) carsSection.classList.remove('hidden')
  } else if (name === 'inbox') {
    if (inboxTab) {
      inboxTab.classList.add('border-blue-600', 'text-blue-600')
      inboxTab.classList.remove('border-transparent', 'text-slate-600')
    }
    if (inboxSection) inboxSection.classList.remove('hidden')
  }
}

bookingsTab.addEventListener('click', () => activateTab('bookings'))
carsTab.addEventListener('click', () => activateTab('cars'))

// Inbox tab switching
if (inboxTab) {
  inboxTab.addEventListener('click', () => {
    activateTab('inbox')
    // load messages
    if (window.loadAdminMessages) window.loadAdminMessages()
  })
}

// navbar inbox button opens inbox tab
if (inboxBtn) {
  inboxBtn.addEventListener('click', () => {
    if (inboxTab) inboxTab.click()
    else {
      activateTab('inbox')
      if (window.loadAdminMessages) window.loadAdminMessages()
    }
  })
}

// Poll for new messages count and show toast when new ones arrive
let lastTotalMessages = null
async function pollMessagesCount() {
  try {
    const res = await apiRequest('/admin/messages?limit=1')
    if (res && typeof res.total === 'number') {
      const total = res.total
      if (lastTotalMessages === null) lastTotalMessages = total
      if (total > lastTotalMessages) {
        const diff = total - lastTotalMessages
        showToast(`You have ${diff} new message(s)`)
        // update inbox count badge
        if (inboxCountEl) {
          inboxCountEl.textContent = String(total)
          inboxCountEl.classList.remove('hidden')
        }
        // refresh messages if inbox open
        if (!inboxSection.classList.contains('hidden') && window.loadAdminMessages) window.loadAdminMessages()
      } else {
        if (inboxCountEl) {
          if (total > 0) { inboxCountEl.textContent = String(total); inboxCountEl.classList.remove('hidden') } else { inboxCountEl.classList.add('hidden') }
        }
      }
      lastTotalMessages = total
    }
  } catch (err) {
    console.warn('pollMessagesCount failed', err)
  } finally {
    setTimeout(pollMessagesCount, 15000)
  }
}

// Simple toast helper
function showToast(msg, timeout = 4000) {
  let t = document.getElementById('adminToast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'adminToast'
    t.className = 'fixed right-4 bottom-4 bg-slate-900 text-white px-4 py-2 rounded shadow-md z-50 hidden'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.classList.remove('hidden')
  setTimeout(() => t.classList.add('hidden'), timeout)
}

// start polling after page load
setTimeout(pollMessagesCount, 2000)

// Ensure a consistent initial tab state
activateTab('bookings')

// Load stats
async function loadStats() {
  try {
    const stats = await apiRequest("/admin/stats")
    totalBookingsEl.textContent = stats.totalBookings
    pendingBookingsEl.textContent = stats.pendingBookings
    approvedBookingsEl.textContent = stats.approvedBookings
    totalRevenueEl.textContent = formatCurrency(stats.totalRevenue)
  } catch (error) {
    console.error("Failed to load stats:", error)
  }
}

// Load bookings
async function loadBookings() {
  try {
    bookings = await apiRequest("/admin/bookings")
    applyFiltersAndRender()
  } catch (error) {
    console.error("Failed to load bookings:", error)
  }
}

// Render bookings
function renderBookings() {
  if (bookings.length === 0) {
    bookingsList.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm p-8 text-center">
        <p class="text-slate-600">No bookings yet.</p>
      </div>
    `
    return
  }

  bookingsList.innerHTML = filteredBookings
    .map(
      (booking) => `
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-1">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            <div>
              <h3 class="text-xl font-bold text-slate-900">${booking.car_name}</h3>
              <p class="text-slate-600 text-sm">${booking.car_type}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-semibold w-fit ${
              booking.status === "approved"
                ? "bg-green-100 text-green-700"
                : booking.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
            }">
              ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
          
          <div class="grid sm:grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span class="text-slate-600">Customer:</span>
              <span class="font-medium text-slate-900">${booking.user_name}</span>
            </div>
            <div>
              <span class="text-slate-600">Email:</span>
              <span class="font-medium text-slate-900">${booking.user_email}</span>
            </div>
            <div>
              <span class="text-slate-600">Phone:</span>
              <span class="font-medium text-slate-900">${booking.user_phone}</span>
            </div>
            <div>
              <span class="text-slate-600">Pickup:</span>
              <span class="font-medium text-slate-900">${booking.pickup_location}</span>
            </div>
            <div>
              <span class="text-slate-600">Dropoff:</span>
              <span class="font-medium text-slate-900">${booking.dropoff_location}</span>
            </div>
            <div>
              <span class="text-slate-600">Dates:</span>
              <span class="font-medium text-slate-900">${formatDate(booking.pickup_date)} - ${formatDate(booking.dropoff_date)}</span>
            </div>
            <div>
              <span class="text-slate-600">Duration:</span>
              <span class="font-medium text-slate-900">${booking.total_days} days</span>
            </div>
            <div>
              <span class="text-slate-600">Total:</span>
              <span class="font-bold text-blue-600">${formatCurrency(booking.total_price)}</span>
            </div>
          </div>

          ${
            booking.status === "pending"
              ? `
            <div class="flex gap-2">
              <button 
                onclick="updateBookingStatus('${booking.id}', 'approved')"
                class="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button 
                onclick="updateBookingStatus('${booking.id}', 'rejected')"
                class="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

// Filtering
const searchInput = document.getElementById('searchInput')
const statusFilter = document.getElementById('statusFilter')

function applyFiltersAndRender() {
  const q = searchInput.value.trim().toLowerCase()
  const status = statusFilter.value

  filteredBookings = bookings.filter(b => {
    if (status !== 'all' && b.status !== status) return false
    if (!q) return true
    return (
      (b.user_name && b.user_name.toLowerCase().includes(q)) ||
      (b.user_email && b.user_email.toLowerCase().includes(q)) ||
      (b.car_name && b.car_name.toLowerCase().includes(q))
    )
  })

  renderBookings()
}

searchInput.addEventListener('input', applyFiltersAndRender)
statusFilter.addEventListener('change', applyFiltersAndRender)

// Export CSV
function convertToCsv(rows) {
  const headers = ['id','user_name','user_email','user_phone','car_name','pickup_location','dropoff_location','pickup_date','dropoff_date','total_days','total_price','status']
  const lines = [headers.join(',')]
  for (const r of rows) {
    const vals = headers.map(h => {
      let v = r[h]
      if (v === null || v === undefined) return ''
      v = String(v).replace(/"/g, '""')
      if (v.includes(',') || v.includes('\n')) return `"${v}"`
      return v
    })
    lines.push(vals.join(','))
  }
  return lines.join('\n')
}

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const csv = convertToCsv(filteredBookings.length ? filteredBookings : bookings)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
})

// Update booking status
window.updateBookingStatus = async (bookingId, status) => {
  try {
    await apiRequest(`/admin/bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })

    alert(`Booking ${status} successfully!`)
    loadBookings()
    loadStats()
  } catch (error) {
    alert("Failed to update booking: " + error.message)
  }
}

// Load cars
async function loadCars() {
  try {
    cars = await apiRequest("/cars")
    renderCars()
  } catch (error) {
    console.error("Failed to load cars:", error)
  }
}

// Render cars
function renderCars() {
  carsList.innerHTML = cars
    .map(
      (car) => `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <img src="${car.image_url}" alt="${car.name}" class="w-full h-48 object-cover">
      <div class="p-6">
        <h3 class="text-xl font-bold text-slate-900 mb-2">${car.name}</h3>
        <p class="text-slate-600 text-sm mb-4">${car.type} • ${car.seats} Seats</p>
        <div class="flex items-center justify-between mb-4">
          <span class="text-2xl font-bold text-blue-600">${formatCurrency(car.price_per_day)}</span>
          <span class="text-slate-600 text-sm">/day</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-700">Availability</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              ${car.available ? "checked" : ""} 
              onchange="toggleCarAvailability('${car.id}', this.checked)"
              class="sr-only peer"
            >
            <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

// Toggle car availability
window.toggleCarAvailability = async (carId, available) => {
  try {
    await apiRequest(`/admin/cars/${carId}`, {
      method: "PATCH",
      body: JSON.stringify({ available }),
    })

    alert(`Car availability updated successfully!`)
    loadCars()
  } catch (error) {
    alert("Failed to update car: " + error.message)
    loadCars() // Reload to reset toggle
  }
}

// Initial load
loadStats()
loadBookings()
loadCars()

// Add car form handling
const addCarForm = document.getElementById('addCarForm')
const addCarMessage = document.getElementById('addCarMessage')
if (addCarForm) {
  addCarForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    addCarMessage.classList.add('hidden')

    const name = document.getElementById('carName').value.trim()
    const type = document.getElementById('carType').value.trim()
    const seats = document.getElementById('carSeats').value
    const price_per_day = document.getElementById('carPrice').value
    const image_url = document.getElementById('carImage').value.trim()
    const available = document.getElementById('carAvailable').checked

    if (!name || !type || !seats || !price_per_day) {
      addCarMessage.className = 'p-3 rounded-md bg-red-100 text-red-800'
      addCarMessage.textContent = 'Please fill required car details'
      addCarMessage.classList.remove('hidden')
      return
    }

    try {
      const newCar = await apiRequest('/admin/cars', {
        method: 'POST',
        body: JSON.stringify({ name, type, seats, price_per_day, image_url, available }),
      })

      addCarMessage.className = 'p-3 rounded-md bg-green-100 text-green-800'
      addCarMessage.textContent = 'Car added successfully!'
      addCarMessage.classList.remove('hidden')
      // Reset form
      addCarForm.reset()
      document.getElementById('carAvailable').checked = true
      // Refresh cars list
      loadCars()
    } catch (err) {
      addCarMessage.className = 'p-3 rounded-md bg-red-100 text-red-800'
      addCarMessage.textContent = 'Failed to add car: ' + (err.message || err)
      addCarMessage.classList.remove('hidden')
    }
  })
}
