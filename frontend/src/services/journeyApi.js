export class JourneyApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'JourneyApiError'
    this.status = status
  }
}

async function getJson(path, signal) {
  const response = await fetch(path, { headers: { Accept: 'application/json' }, cache: 'no-store', signal })
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
}
