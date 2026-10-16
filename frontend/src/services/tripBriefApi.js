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
        detail = typeof body.detail === 'string' ? body.detail : ''
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

function workspacePath(workspaceId) {
  return `/api/v1/workspaces/${encodeURIComponent(workspaceId)}`
}

export const tripBriefApi = {
  async listTrips(workspaceId, options) {
    const result = await requestJson(`${workspacePath(workspaceId)}/trips`, options)
    return Array.isArray(result.items) ? result.items : []
  },
  getContext(workspaceId, tripId, options) {
    return requestJson(`${workspacePath(workspaceId)}/trips/${encodeURIComponent(tripId)}/context`, options)
  },
}

export { ApiError }
