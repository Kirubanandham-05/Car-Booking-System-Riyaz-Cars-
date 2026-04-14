// Use shared apiRequest helper and prefix with /admin
async function callAdminApi(path, opts = {}) {
  return await apiRequest('/admin' + path, opts)
}

function formatDate(d) {
  try { return new Date(d).toLocaleString() } catch(e) { return d }
}

async function loadMessages() {
  const container = document.getElementById('messagesContainer')
  container.innerHTML = 'Loading...'
  try {
  const data = await callAdminApi('/messages')
    container.innerHTML = ''
    const tpl = document.getElementById('rowTpl')
    data.rows.forEach(r => {
      const el = tpl.content.cloneNode(true)
      el.querySelector('.sender').textContent = r.sender_name || `User ${r.sender_id || 'anon'}`
      if (!r.is_read) {
        const dot = el.querySelector('.unread-dot')
        if (dot) dot.classList.remove('hidden')
      }
      el.querySelector('.subject').textContent = r.subject || ''
      el.querySelector('.created_at').textContent = formatDate(r.created_at)
      el.querySelector('.body').textContent = r.body
      const viewBtn = el.querySelector('.viewBtn')
      viewBtn.addEventListener('click', async () => {
        await markAsRead(r.id)
        try {
          const detail = await callAdminApi(`/messages/${r.id}`)
          showView((detail && detail.row) ? detail.row : r)
        } catch (e) {
          showView(r)
        }
        loadMessages()
      })
      const replyBtn = el.querySelector('.replyBtn')
      replyBtn.addEventListener('click', () => promptReply(r))
    const retryBtn = document.createElement('button')
    retryBtn.className = 'retryBtn px-2 py-1 border rounded text-sm'
    retryBtn.textContent = 'Retry send'
    retryBtn.addEventListener('click', () => retrySend(r))
      el.querySelector('.mt-3').appendChild(retryBtn)
      container.appendChild(el)
    })
  } catch (err) {
    container.innerHTML = 'Failed to load messages: ' + (err.message || err)
  }
}

function showView(row) {
  const modal = document.getElementById('viewModal')
  const content = document.getElementById('viewContent')
  content.innerHTML = `<p><strong>From:</strong> ${row.sender_name || ''} &lt;${row.sender_email || ''}&gt;</p><p><strong>Subject:</strong> ${row.subject || ''}</p><hr/><div style="white-space:pre-wrap">${escapeHtml(row.body)}</div>`
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

async function markAsRead(id) {
  try {
    await callAdminApi(`/messages/${id}/read`, { method: 'PATCH' })
  } catch (err) {
    console.warn('Failed to mark message read:', err)
  }
}

function hideView() {
  const modal = document.getElementById('viewModal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

function escapeHtml(s) {
  if (!s) return ''
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

async function promptReply(row) {
  const reply = prompt('Type your reply to the sender (this will be sent via email):')
  if (!reply) return
  try {
    await callAdminApi(`/messages/${row.id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) })
    alert('Reply sent')
  } catch (err) {
    alert('Failed to send reply: ' + (err.message || err))
  }
}

async function retrySend(row) {
  try {
    const res = await callAdminApi(`/messages/${row.id}/send`, { method: 'POST' })
    if (res.preview) {
      alert('Message sent (preview): ' + res.preview)
    } else {
      alert('Send result: ' + JSON.stringify(res))
    }
    // refresh list
    loadMessages()
  } catch (err) {
    alert('Retry failed: ' + (err.message || err))
  }
}

document.getElementById('closeView').addEventListener('click', hideView)

// Expose loader so admin dashboard can call it when the Inbox tab is active
window.loadAdminMessages = loadMessages

// Also expose a helper to retry sending unsent messages in bulk
window.bulkRetryUnsent = async function() {
  try {
    const res = await callAdminApi('/messages/send_unsent', { method: 'POST' })
    return res
  } catch (err) {
    throw err
  }
}
