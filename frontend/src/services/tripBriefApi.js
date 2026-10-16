class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
  }
}

async function requestJson(path, { signal } = {}) {
  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 8000)
  const requestController = new AbortController()
  const abortFromCaller = () => requestController.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const abortFromTimeout = () => requestController.abort()
  timeoutController.signal.addEventListener('abort', abortFromTimeout, { once: true })
  try {
    const response = await fetch(path, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: requestController.signal,
    })
    if (!response.ok) {
      let detail = ''
      try {
        const body = await response.json()
        detail = typeof body?.error?.message === 'string'
          ? body.error.message
          : typeof body.detail === 'string' ? body.detail : ''
      } catch {
        // Keep the stable HTTP status when an upstream error has no JSON body.
      }
      throw new ApiError(response.status, detail)
    }
    return await response.json()
  } catch (error) {
    if (timeoutController.signal.aborted && !signal?.aborted) {
      throw new ApiError(503, 'The request timed out')
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
    const result = await requestJson('/api/v1/trips', options)
    return Array.isArray(result.items) ? result.items : []
  },
  getContext(_localScope, tripId, options) {
    return requestJson(`/api/v1/trips/${encodeURIComponent(tripId)}/context`, options)
  },
}

export { ApiError }
