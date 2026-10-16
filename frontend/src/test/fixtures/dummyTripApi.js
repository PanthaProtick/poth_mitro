import { contexts, trips } from './dummyTripData'

const wait = (signal, ms = 350) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Request aborted', 'AbortError')) }, { once: true })
})

const clone = (value) => structuredClone(value)
const requests = new Map()

export const dummyTripApi = {
  async getMe() { return { user: { id: 'demo-user', name: 'Demo Traveller', email: 'demo@dhakapath.test' }, workspace: { id: 'demo-workspace', name: 'DhakaPath Demo Workspace' }, role: 'admin' } },
  async listTrips(_workspaceId, { signal } = {}) { await wait(signal); return clone(trips) },
  async getContext(_workspaceId, tripId, { signal } = {}) { await wait(signal); return clone(contexts[tripId]) },
  async createIncident(_workspaceId, payload, { idempotencyKey, signal } = {}) {
    await wait(signal)
    if (requests.has(idempotencyKey)) return clone(requests.get(idempotencyKey).response)
    const report = { ...payload, id: `report-${Date.now()}`, version: 1, status: 'reported', freshness: 'current', age_minutes: 0, is_synthetic: true }
    const response = { incident: report, request_id: `req-${Date.now()}` }
    requests.set(idempotencyKey, { response })
    return clone(response)
  },
  async updateIncident(_workspaceId, incidentId, payload, { idempotencyKey, signal } = {}) {
    await wait(signal)
    if (requests.has(idempotencyKey)) return clone(requests.get(idempotencyKey).response)
    const response = { incident: { ...payload, id: incidentId, version: (payload.expected_version || 1) + 1, status: 'reported', freshness: 'current', age_minutes: 0 }, request_id: `req-${Date.now()}` }
    requests.set(idempotencyKey, { response })
    return clone(response)
  },
  async getRequest(_workspaceId, requestKey, { signal } = {}) { await wait(signal, 180); return clone(requests.get(requestKey) || { status: 'not_found' }) },
}
