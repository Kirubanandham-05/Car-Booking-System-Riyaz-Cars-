// Contact owner modal logic
// Provide a local fallback for `apiRequest` so the contact modal works on pages
// that don't include `utils.js` (prevents `apiRequest is not defined`).
if (typeof apiRequest === 'undefined') {
  // Minimal compatible implementation of apiRequest used by other scripts
  window.apiRequest = async function (endpoint, options = {}) {
    const API_URL = '/api'
    const token = localStorage.getItem('token')
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    }

    const response = await fetch(`${API_URL}${endpoint}`, config)
    const text = await response.text()
    let data = null
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
}

if (typeof document !== 'undefined') {
  const contactBtn = document.getElementById('contactOwnerBtn')
  if (!contactBtn) {
    // nothing to do
  } else {
    // Create modal markup
    const modal = document.createElement('div')
    modal.id = 'contactModal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-40 hidden items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 class="text-lg font-semibold mb-2">Contact owner</h3>
        <p class="text-sm text-slate-500 mb-4">Send a message to the owner. We'll deliver it securely.</p>
        <div id="contactMsg" class="hidden mb-3 p-2 rounded text-sm"></div>
        <label class="block text-sm font-medium">Subject (optional)</label>
        <input id="contactSubject" class="mt-1 mb-3 w-full px-3 py-2 border rounded" />
        <div id="guestFields" class="hidden">
          <label class="block text-sm font-medium">Your name</label>
          <input id="contactName" class="mt-1 mb-2 w-full px-3 py-2 border rounded" />
          <label class="block text-sm font-medium">Your email</label>
          <input id="contactEmail" class="mt-1 mb-3 w-full px-3 py-2 border rounded" />
        </div>
        <label class="block text-sm font-medium">Message</label>
        <textarea id="contactBody" class="mt-1 w-full px-3 py-2 border rounded" rows="5"></textarea>
        <div class="mt-1 text-xs text-slate-500"><span id="charCount">0</span> characters</div>
        <div class="mt-2 text-xs text-slate-400">Drafts saved locally</div>
        <div class="mt-4 flex justify-end gap-3">
          <button id="contactCancel" class="px-3 py-2 border rounded">Cancel</button>
          <button id="contactSend" class="px-3 py-2 bg-indigo-600 text-white rounded">Send</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const contactModal = document.getElementById('contactModal')
    const contactMsg = document.getElementById('contactMsg')
    const contactCancel = document.getElementById('contactCancel')
    const contactSend = document.getElementById('contactSend')

    // ownerId can be passed on the button as data-owner-id
    contactBtn.addEventListener('click', () => {
  contactModal.classList.remove('hidden')
  contactModal.classList.add('flex')
      contactMsg.classList.add('hidden')
  const ownerId = contactBtn.dataset.ownerId || null
      const saved = localStorage.getItem('contact_draft')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.ownerId === ownerId) {
            document.getElementById('contactBody').value = parsed.body || ''
            document.getElementById('contactSubject').value = parsed.subject || ''
          } else {
            document.getElementById('contactBody').value = ''
            document.getElementById('contactSubject').value = ''
          }
        } catch (e) {
          document.getElementById('contactBody').value = ''
          document.getElementById('contactSubject').value = ''
        }
      } else {
        document.getElementById('contactBody').value = ''
        document.getElementById('contactSubject').value = ''
      }
      // show guest fields if not logged in
      const user = window.getUser ? window.getUser() : null
      if (!user) {
        document.getElementById('guestFields').classList.remove('hidden')
      } else {
        document.getElementById('guestFields').classList.add('hidden')
      }
      updateCharCount()
      // store ownerId only when present; avoid storing literal string "null"
      if (ownerId) {
        contactModal.dataset.ownerId = ownerId
      } else {
        delete contactModal.dataset.ownerId
      }
    })

    contactCancel.addEventListener('click', () => {
      contactModal.classList.add('hidden')
      contactModal.classList.remove('flex')
    })

    const bodyEl = document.getElementById('contactBody')
    const subjectEl = document.getElementById('contactSubject')
    const charCountEl = document.getElementById('charCount')

    function updateCharCount() {
      charCountEl.textContent = (bodyEl.value || '').length
    }

    // autosave draft
    let autosaveTimer = null
    function scheduleAutosave() {
      if (autosaveTimer) clearTimeout(autosaveTimer)
      autosaveTimer = setTimeout(() => {
        const ownerId = contactModal.dataset.ownerId || null
        const draft = { ownerId, subject: subjectEl.value, body: bodyEl.value, updatedAt: Date.now() }
        localStorage.setItem('contact_draft', JSON.stringify(draft))
      }, 800)
    }

    bodyEl.addEventListener('input', () => { updateCharCount(); scheduleAutosave() })
    subjectEl.addEventListener('input', () => scheduleAutosave())


    contactSend.addEventListener('click', async () => {
      contactMsg.classList.add('hidden')
  const body = document.getElementById('contactBody').value.trim()
  const subject = document.getElementById('contactSubject').value.trim()
  // dataset attributes are strings; convert to integer or null
  const owner_raw = contactModal.dataset.ownerId
  const owner_id = owner_raw && owner_raw !== 'null' ? (isNaN(Number(owner_raw)) ? null : Number(owner_raw)) : null
  const sender_name = (document.getElementById('contactName') && document.getElementById('contactName').value.trim()) || null
  const sender_email = (document.getElementById('contactEmail') && document.getElementById('contactEmail').value.trim()) || null
      if (!body) {
        contactMsg.className = 'mb-3 p-2 rounded text-sm bg-red-100 text-red-800'
        contactMsg.textContent = 'Please enter a message.'
        contactMsg.classList.remove('hidden')
        return
      }

      contactSend.disabled = true
      contactSend.textContent = 'Sending...'
    console.log('[contact] sending', { owner_id, subject, body: body.slice(0,120) })

      try {
        const payload = { owner_id, subject, message: body }
        // include recaptcha token if grecaptcha available
        if (window.grecaptcha && window.RECAPTCHA_SITE_KEY) {
          try {
            const token = await window.grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: 'contact' })
            payload.recaptchaToken = token
          } catch (e) {
            console.warn('reCAPTCHA execute failed', e)
          }
        }

        await apiRequest('/contact', {
          method: 'POST',
          body: JSON.stringify({ ...payload, sender_name, sender_email }),
        })
          console.log('[contact] sent ok')
        contactMsg.className = 'mb-3 p-2 rounded text-sm bg-green-100 text-green-800'
        contactMsg.textContent = 'Message sent. The owner will receive it shortly.'
        contactMsg.classList.remove('hidden')
        localStorage.removeItem('contact_draft')
        setTimeout(() => {
          contactModal.classList.add('hidden')
          contactModal.classList.remove('flex')
        }, 1200)
      } catch (err) {
        contactMsg.className = 'mb-3 p-2 rounded text-sm bg-red-100 text-red-800'
        // Build a more helpful message for debugging: include status and response body when available
        let friendly = err.message || 'Unable to send message. Please try again later.'
        if (err.status) friendly += ` (status: ${err.status})`
        if (err.response) {
          try {
            const r = typeof err.response === 'string' ? err.response : JSON.stringify(err.response)
            friendly += ` — ${r}`
          } catch (e) {
            // ignore stringify failures
          }
        }
        contactMsg.textContent = friendly
        contactMsg.classList.remove('hidden')
        console.error('contact send error:', err)
        // if fetch response details available, log them for debugging
        if (err && err.response) console.error('contact response details:', err.response)
      } finally {
        contactSend.disabled = false
        contactSend.textContent = 'Send'
      }
    })
    // init char count
    updateCharCount()
  }
}
