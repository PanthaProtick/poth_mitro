export class JourneyApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'JourneyApiError'
    this.status = status
  }
}

async function getJson(path, signal) {
  const timeoutSignal = AbortSignal.timeout(10000)
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  let response
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: requestSignal })
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new JourneyApiError(0, 'The local API did not respond within 10 seconds. Start or restart the backend, then retry.')
    }
    throw error
  }
  if (!response.ok) {
    let message = `Local API request failed (${response.status}).`
    try {
      const body = await response.json()
      message = body?.error?.message || body?.detail || message
    } catch {
      // Preserve a useful HTTP error even when the service returns no JSON body.
    }
    throw new JourneyApiError(response.status, message)
  }
  return response.json()
}

export const journeyApi = {
  getNetwork({ signal } = {}) {
    return getJson('/api/v1/map-data/network', signal)
  },
  search({ originId, destinationId, avoidReportedRoutes = false, signal }) {
    const query = new URLSearchParams({ origin_id: originId, destination_id: destinationId })
    if (avoidReportedRoutes) query.set('avoid_reported_routes', 'true')
    return getJson(`/api/v1/journeys/search?${query}`, signal)
  },
  submitFeedback({ pathFingerprint, catalogVersion, originId, destinationId, avoidReportedRoutes, verdict, correction }) {
    return fetch('/api/v1/journeys/feedback', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path_fingerprint: pathFingerprint,
        catalog_version: catalogVersion,
        origin_id: originId,
        destination_id: destinationId,
        avoid_reported_routes: avoidReportedRoutes,
        verdict,
        correction,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        let message = `Local API request failed (${response.status}).`
        try {
          const body = await response.json()
          message = body?.error?.message || body?.detail || message
        } catch { /* Keep the useful HTTP status when no JSON is available. */ }
        throw new JourneyApiError(response.status, message)
      }
      return response.json()
    })
  },
}
