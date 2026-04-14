// This file uses shared helpers from `public/js/utils.js` which must be loaded first:
// - apiRequest(endpoint, options)
// - checkAuth()
// - getUser()
// - logout()
// - formatCurrency(amount)
// - calculateDays(startDate, endDate)
// - formatDate(date)

// Check authentication
if (!checkAuth()) {
  throw new Error("Not authenticated")
}

const user = getUser()
const userName = document.getElementById("userName")
const logoutBtn = document.getElementById("logoutBtn")
const carsTab = document.getElementById("carsTab")
const bookingsTab = document.getElementById("bookingsTab")
const carsSection = document.getElementById("carsSection")
const bookingsSection = document.getElementById("bookingsSection")
const carsGrid = document.getElementById("carsGrid")
const bookingsList = document.getElementById("bookingsList")
const bookingModal = document.getElementById("bookingModal")
const closeModal = document.getElementById("closeModal")
const bookingForm = document.getElementById("bookingForm")

let cars = []
let selectedCar = null

// Set user name
userName.textContent = user.name

// Logout
logoutBtn.addEventListener("click", logout)

// Tab switching
carsTab.addEventListener("click", () => {
  carsTab.classList.add("border-blue-600", "text-blue-600")
  carsTab.classList.remove("border-transparent", "text-slate-600")
  bookingsTab.classList.remove("border-blue-600", "text-blue-600")
  bookingsTab.classList.add("border-transparent", "text-slate-600")
  carsSection.classList.remove("hidden")
  bookingsSection.classList.add("hidden")
})

bookingsTab.addEventListener("click", () => {
  bookingsTab.classList.add("border-blue-600", "text-blue-600")
  bookingsTab.classList.remove("border-transparent", "text-slate-600")
  carsTab.classList.remove("border-blue-600", "text-blue-600")
  carsTab.classList.add("border-transparent", "text-slate-600")
  bookingsSection.classList.remove("hidden")
  carsSection.classList.add("hidden")
  loadBookings()
})

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
  carsGrid.innerHTML = cars
    .map(
      (car) => `
      <div class="bg-white rounded-xl shadow-sm overflow-hidden ${!car.available ? "opacity-60" : ""}">
        <img src="${car.image_url}" alt="${car.name}" class="w-full h-48 object-cover">
        <div class="p-6">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-xl font-bold text-slate-900">${car.name}</h3>
            ${
              car.available
                ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Available</span>'
                : '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">Unavailable</span>'
            }
          </div>
          <p class="text-slate-600 text-sm mb-4">${car.type} • ${car.seats} Seats</p>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-2xl font-bold text-blue-600">${formatCurrency(car.price_per_day)}</span>
              <span class="text-slate-600 text-sm">/day</span>
            </div>
            <button 
              onclick="openBookingModal('${car.id}')" 
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors ${!car.available ? "opacity-50 cursor-not-allowed" : ""}"
              ${!car.available ? "disabled" : ""}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    `,
    )
    .join("")
}

// Open booking modal
window.openBookingModal = (carId) => {
  const normalizedCarId = String(carId)
  selectedCar = cars.find((c) => String(c.id) === normalizedCarId)
  if (!selectedCar || !selectedCar.available) return

  document.getElementById("selectedCarId").value = normalizedCarId
  bookingModal.classList.remove("hidden")
  bookingModal.classList.add("flex")

  // Set min date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("pickupDate").min = today
  document.getElementById("dropoffDate").min = today
}

// Close modal
closeModal.addEventListener("click", () => {
  bookingModal.classList.add("hidden")
  bookingModal.classList.remove("flex")
  bookingForm.reset()
})

// Calculate price
document.getElementById("pickupDate").addEventListener("change", calculatePrice)
document.getElementById("dropoffDate").addEventListener("change", calculatePrice)

function calculatePrice() {
  const pickupDate = document.getElementById("pickupDate").value
  const dropoffDate = document.getElementById("dropoffDate").value

  if (pickupDate && dropoffDate && selectedCar) {
    const days = calculateDays(pickupDate, dropoffDate)
    const totalPrice = days * selectedCar.price_per_day

    document.getElementById("totalDays").textContent = days
    document.getElementById("totalPrice").textContent = formatCurrency(totalPrice)
  }
}

// Submit booking
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const carId = document.getElementById("selectedCarId").value
  const pickupLocation = document.getElementById("pickupLocation").value
  const dropoffLocation = document.getElementById("dropoffLocation").value
  const pickupDate = document.getElementById("pickupDate").value
  const dropoffDate = document.getElementById("dropoffDate").value

  const totalDays = calculateDays(pickupDate, dropoffDate)
  const totalPrice = totalDays * selectedCar.price_per_day

  try {
    await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify({
        car_id: carId,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_date: pickupDate,
        dropoff_date: dropoffDate,
        total_days: totalDays,
        total_price: totalPrice,
      }),
    })

    alert("Booking submitted successfully! Waiting for admin approval.")
    bookingModal.classList.add("hidden")
    bookingModal.classList.remove("flex")
    bookingForm.reset()
    loadBookings()
  } catch (error) {
    alert("Failed to create booking: " + error.message)
  }
})

// Load bookings
async function loadBookings() {
  try {
    const bookings = await apiRequest("/bookings/my-bookings")
    renderBookings(bookings)
  } catch (error) {
    console.error("Failed to load bookings:", error)
  }
}

// Render bookings
function renderBookings(bookings) {
  if (bookings.length === 0) {
    bookingsList.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm p-8 text-center">
        <p class="text-slate-600">No bookings yet. Book a car to get started!</p>
      </div>
    `
    return
  }

  bookingsList.innerHTML = bookings
    .map(
      (booking) => `
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex flex-col md:flex-row gap-6">
          <img src="${booking.car_image}" alt="${booking.car_name}" class="w-full md:w-32 h-32 object-cover rounded-lg">
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
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
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
                <span class="text-slate-600">Total:</span>
                <span class="font-bold text-blue-600">${formatCurrency(booking.total_price)}</span>
                <span class="text-slate-600">(${booking.total_days} days)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    )
    .join("")
}

// Initial load
loadCars()
