// Profile page client logic
if (!checkAuth()) throw new Error('Not authenticated')

// elements for edit mode
const editProfileBtn = document.getElementById('editProfileBtn')
const cancelBtn = document.getElementById('cancelBtn')
const saveProfileBtn = document.getElementById('saveProfileBtn')
const editHint = document.getElementById('editHint')
const profileForm = document.getElementById('profileForm')
const emailEl = document.getElementById('email')
const nameEl = document.getElementById('name')
const phoneEl = document.getElementById('phone')
const passwordEl = document.getElementById('password')
const profileMessage = document.getElementById('profileMessage')
const avatarInput = document.getElementById('avatarInput')
const avatarPreview = document.getElementById('avatarPreview')
const avatarUploadMessage = document.getElementById('avatarUploadMessage')
const addressEl = document.getElementById('address')
const displayName = document.getElementById('displayName')
const displayEmail = document.getElementById('displayEmail')

// initial view-mode: ensure inputs are disabled and Save/Cancel hidden
function setViewMode() {
  nameEl.disabled = true
  phoneEl.disabled = true
  passwordEl.disabled = true
  addressEl.disabled = true
  avatarInput.disabled = true
  saveProfileBtn.classList.add('hidden')
  cancelBtn.classList.add('hidden')
  editHint.classList.remove('hidden')
  editProfileBtn.textContent = 'Edit profile'
  // hide password field and change photo button in view mode
  const pwWrap = document.getElementById('passwordWrapper')
  if (pwWrap) pwWrap.classList.add('hidden')
  const changeBtn = document.getElementById('changeAvatarBtn')
  if (changeBtn) changeBtn.classList.add('hidden')
}

function setEditMode() {
  nameEl.disabled = false
  phoneEl.disabled = false
  passwordEl.disabled = false
  addressEl.disabled = false
  avatarInput.disabled = false
  saveProfileBtn.classList.remove('hidden')
  cancelBtn.classList.remove('hidden')
  editHint.classList.add('hidden')
  editProfileBtn.textContent = 'Cancel'
  // reveal password field and change photo button in edit mode
  const pwWrap = document.getElementById('passwordWrapper')
  if (pwWrap) pwWrap.classList.remove('hidden')
  const changeBtn = document.getElementById('changeAvatarBtn')
  if (changeBtn) changeBtn.classList.remove('hidden')
}

let originalProfile = null

editProfileBtn.addEventListener('click', () => {
  if (editProfileBtn.textContent === 'Edit profile') {
    // enter edit mode
    originalProfile = {
      name: nameEl.value,
      phone: phoneEl.value,
      address: addressEl.value,
    }
    setEditMode()
  } else {
    // cancel edit
    if (originalProfile) {
      nameEl.value = originalProfile.name
      phoneEl.value = originalProfile.phone
      addressEl.value = originalProfile.address
    }
    passwordEl.value = ''
    setViewMode()
  }
})

cancelBtn.addEventListener('click', () => {
  // same as clicking editProfileBtn when in cancel state
  if (originalProfile) {
    nameEl.value = originalProfile.name
    phoneEl.value = originalProfile.phone
    addressEl.value = originalProfile.address
  }
  passwordEl.value = ''
  setViewMode()
})

async function loadProfile() {
  try {
    const profile = await apiRequest('/auth/me')
    emailEl.value = profile.email
    nameEl.value = profile.name || ''
    phoneEl.value = profile.phone || ''
    addressEl.value = profile.address || ''
    if (profile.avatar_url) {
      avatarPreview.src = profile.avatar_url
    }
    // update display area
    if (displayName) displayName.textContent = profile.name || profile.email
    if (displayEmail) displayEmail.textContent = profile.email
    // ensure view mode after loading
    setViewMode()
  } catch (err) {
    profileMessage.className = 'p-3 rounded-md bg-red-100 text-red-800'
    profileMessage.textContent = 'Unable to load your profile. Please refresh the page or try again later.'
    profileMessage.classList.remove('hidden')
    console.error('loadProfile error:', err)
  }
}

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const payload = {
    name: nameEl.value.trim(),
    phone: phoneEl.value.trim(),
    address: addressEl.value.trim(),
  }
  if (passwordEl.value) payload.password = passwordEl.value

  try {
    const updated = await apiRequest('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    profileMessage.className = 'p-3 rounded-md bg-green-100 text-green-800'
    profileMessage.textContent = 'Your profile was updated successfully.'
    profileMessage.classList.remove('hidden')
    passwordEl.value = ''
    // update localStorage user
    const user = getUser() || {}
    user.name = updated.name
    user.phone = updated.phone
    localStorage.setItem('user', JSON.stringify(user))
  } catch (err) {
    profileMessage.className = 'p-3 rounded-md bg-red-100 text-red-800'
    profileMessage.textContent = 'Unable to save changes. Please check your inputs and try again.'
    profileMessage.classList.remove('hidden')
    console.error('update profile error:', err)
  }
})

// Avatar upload handling: read file, convert to base64 and POST to /api/auth/avatar
if (avatarInput) {
  // make the change photo button trigger the hidden file input
  const changeAvatarBtn = document.getElementById('changeAvatarBtn')
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', () => avatarInput.click())
  }

  avatarInput.addEventListener('change', async () => {
    avatarUploadMessage.textContent = ''
    const file = avatarInput.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      avatarUploadMessage.textContent = 'Please select a PNG or JPG image.'
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      avatarUploadMessage.textContent = 'Image is too large (max 5MB).'
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      avatarPreview.src = reader.result
      avatarUploadMessage.textContent = 'Uploading...'
      try {
        const res = await apiRequest('/auth/avatar', {
          method: 'POST',
          body: JSON.stringify({ avatar_base64: reader.result, filename: file.name }),
        })
        avatarUploadMessage.textContent = 'Upload successful.'
        // Save avatar URL to profile
        await apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify({ avatar_url: res.url }) })
        avatarUploadMessage.textContent = 'Avatar updated.'
      } catch (err) {
        avatarUploadMessage.textContent = 'Unable to upload avatar. Please try again.'
        console.error('avatar upload error:', err)
      }
    }
    reader.readAsDataURL(file)
  })
}

loadProfile()
