// Local visual fixture only. It follows the response shapes in docs/api_contracts.md.
// App.jsx selects it only in a local Vite development preview.
const trips = [
  { id: '2d254577-3179-42e5-82a3-2f1c8ea150ef', name: 'Mirpur 10 to Shahbagh', is_synthetic: true },
  { id: 'c7de29aa-a5e5-4e0a-b07b-8f7491ce9f2a', name: 'Uttara North to Farmgate', is_synthetic: true },
  { id: '0d29ca0f-3eec-4db4-b010-f4de81f66e3f', name: 'Example with no matching reports', is_synthetic: true },
]

const contexts = {
  '2d254577-3179-42e5-82a3-2f1c8ea150ef': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: {
      state: 'affects_trip',
      reason: 'A report matches the Farmgate segment and the trip\'s road mode; its direction is unknown.',
    },
    trip: {
      id: '2d254577-3179-42e5-82a3-2f1c8ea150ef',
      name: 'Mirpur 10 to Shahbagh',
      is_synthetic: true,
      segments: [
        { id: 'bc24d501-8e9b-48b4-871d-cb848a808caa', ordinal: 1, mode: 'MRT-6', origin: 'Mirpur 10', destination: 'Farmgate' },
        { id: 'c34da1ca-e1ac-48ac-9433-03e3819b8cbe', ordinal: 2, mode: 'Walking', origin: 'Farmgate', destination: 'Farmgate bus stop' },
        { id: '72a5f45c-8712-4a49-9a15-a1ab87f6142a', ordinal: 3, mode: 'Bus', origin: 'Farmgate', destination: 'Shahbagh' },
      ],
    },
    evidence_total: 1,
    reports: [
      {
        id: '08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b',
        title: 'Waterlogging reported near Farmgate',
        location: 'Farmgate (synthetic example)',
        mode: 'Road traffic',
        direction: null,
        observed_at: '2026-10-16T02:15:00Z',
        age_minutes: 15,
        freshness: 'current',
        source_type: 'synthetic_example',
        status: 'reported',
        description: 'Illustrative report used only to review screen layout and uncertainty wording.',
        confirmation_note: 'No second source is included in this example.',
        is_synthetic: true,
        version: 1,
      },
    ],
    reports_next_cursor: null,
  },
  'c7de29aa-a5e5-4e0a-b07b-8f7491ce9f2a': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: {
      state: 'unknown',
      reason: 'A potentially matching report is disputed, and its direction and observation time are unknown.',
    },
    trip: {
      id: 'c7de29aa-a5e5-4e0a-b07b-8f7491ce9f2a',
      name: 'Uttara North to Farmgate',
      is_synthetic: true,
      segments: [
        { id: '9b00f4f1-c24f-48af-a8e4-682f9f6bb284', ordinal: 1, mode: 'MRT-6', origin: 'Uttara North', destination: 'Farmgate' },
      ],
    },
    evidence_total: 1,
    reports: [
      {
        id: '3e506dca-3ea1-4b18-9092-4b2617c2f050',
        title: 'Road closure direction not recorded',
        location: 'A fictional junction',
        mode: 'Road traffic',
        direction: null,
        observed_at: null,
        age_minutes: null,
        freshness: 'unknown',
        source_type: 'synthetic_example',
        status: 'disputed',
        description: 'Long example text confirms that missing observation time and direction stay visible.',
        confirmation_note: null,
        is_synthetic: true,
        version: 2,
      },
    ],
    reports_next_cursor: null,
  },
  '0d29ca0f-3eec-4db4-b010-f4de81f66e3f': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: { state: 'not_affected', reason: 'No available report matched the known trip details. This does not confirm that the trip is clear.' },
    trip: { id: '0d29ca0f-3eec-4db4-b010-f4de81f66e3f', name: 'Example with no matching reports', is_synthetic: true, segments: [] },
    evidence_total: 0,
    reports: [],
    reports_next_cursor: null,
  },
}

function wait(signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, 200)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new DOMException('Request aborted', 'AbortError'))
    }, { once: true })
  })
}

// This is the normalized service interface used by TripBriefScreen. The real
// HTTP adapter unwraps TripListResponse.items before exposing the same array.
export const tripBriefFixtureApi = {
  async listTrips(_workspaceId, { signal } = {}) {
    await wait(signal)
    return trips
  },
  async getContext(_workspaceId, tripId, { signal } = {}) {
    await wait(signal)
    return contexts[tripId]
  },
}
