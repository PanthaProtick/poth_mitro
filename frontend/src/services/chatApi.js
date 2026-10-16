class ChatApiError extends Error {
  constructor(status, message, code) {
    super(message || `Request failed (${status})`)
    this.name = 'ChatApiError'
    this.status = status
    this.code = code
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(path, {
    method,
    cache: method === 'GET' ? 'no-store' : 'default',
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  })
  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload?.error?.message || payload?.detail || ''
    throw new ChatApiError(response.status, detail, payload?.error?.code)
  }
  return payload
}

export const chatApi = {
  createSession: (options) => request('/api/v1/chat/sessions', { method: 'POST', body: {}, ...options }),
  listMessages: (sessionId, options) => request(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`, options),
  sendMessage: (sessionId, message, options) => request(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`, { method: 'POST', body: { message }, ...options }),
  deleteSession: (sessionId, options) => request(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE', ...options }),
}

export { ChatApiError }
