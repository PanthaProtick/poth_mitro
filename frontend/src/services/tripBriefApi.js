class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
  }
}

async function requestJson(path, { signal, method = 'GET', body, idempotencyKey } = {}) {
  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 8000)
  const requestController = new AbortController()
  const abortFromCaller = () => requestController.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const abortFromTimeout = () => requestController.abort()
  timeoutController.signal.addEventListener('abort', abortFromTimeout, { once: true })
  try {
    const response = await fetch(path, {
      method,
      cache: method === 'GET' ? 'no-store' : 'default',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: requestController.signal,
    })
    if (!response.ok) {
      let detail = ''
      let errorBody = null
      try {
        errorBody = await response.json()
        detail = typeof errorBody?.error?.message === 'string'
          ? errorBody.error.message
          : typeof errorBody.detail === 'string' ? errorBody.detail : ''
      } catch {
        // Keep the stable HTTP status when an upstream error has no JSON body.
      }
      const error = new ApiError(response.status, detail)
      error.code = errorBody?.error?.code || errorBody?.detail?.code
      error.fields = errorBody?.error?.fields || []
      error.meta = errorBody?.meta || errorBody?.error?.meta || null
      error.apiResponded = Boolean(errorBody?.error?.code || errorBody?.request_id)
      error.unknownOutcome = method !== 'GET' && response.status >= 500
      throw error
    }
    return await response.json()
  } catch (error) {
    if (timeoutController.signal.aborted && !signal?.aborted) {
      const timeout = new ApiError(503, 'The request timed out; the write outcome is unknown')
      timeout.unknownOutcome = method !== 'GET'
      timeout.apiResponded = false
      throw timeout
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
    timeoutController.signal.removeEventListener('abort', abortFromTimeout)
  }
}

export const tripBriefApi = {
  async listTrips(_localScope, options) {
    const query = new URLSearchParams({ limit: '20' })
    if (options?.cursor) query.set('cursor', options.cursor)
    return requestJson(`/api/v1/trips?${query}`, options)
  },
  getContext(_localScope, tripId, options) {
    const query = new URLSearchParams({ report_limit: '20' })
    if (options?.reportCursor) query.set('report_cursor', options.reportCursor)
    return requestJson(`/api/v1/trips/${encodeURIComponent(tripId)}/context?${query}`, options)
  },
  getReport(reportId) {
    return requestJson(`/api/v1/incidents/${encodeURIComponent(reportId)}`)
  },
  createReport(payload, idempotencyKey) {
    return requestJson('/api/v1/incidents', { method: 'POST', body: payload, idempotencyKey })
  },
  updateReport(reportId, payload, idempotencyKey) {
    return requestJson(`/api/v1/incidents/${encodeURIComponent(reportId)}`, {
      method: 'PATCH', body: payload, idempotencyKey,
    })
  },
}

export { ApiError }
