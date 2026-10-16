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
        { id: 1, ordinal: 1, mode: 'MRT-6', origin: 'Mirpur 10', destination: 'Farmgate', route_reference_available: true, route_data_quality: 'approximate', route_id: 201 },
        { id: 2, ordinal: 2, mode: 'Walking', origin: 'Farmgate', destination: 'Farmgate bus stop', route_reference_available: false, route_data_quality: null, route_id: null },
        { id: 3, ordinal: 3, mode: 'Bus', origin: 'Farmgate', destination: 'Shahbagh', route_reference_available: true, route_data_quality: 'approximate', route_id: 101 },
      ],
    },
    evidence_total: 1,
    reports: [
      {
        id: '08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b',
        kind: 'waterlogging',
        title: 'Waterlogging reported near Farmgate',
        location: 'Farmgate (synthetic example)',
        route_id: 101,
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
        created_at: '2026-10-16T02:15:00Z',
        updated_at: '2026-10-16T02:15:00Z',
        actor_label: 'synthetic_example',
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
        { id: 4, ordinal: 1, mode: 'MRT-6', origin: 'Uttara North', destination: 'Farmgate', route_reference_available: true, route_data_quality: 'approximate', route_id: 202 },
      ],
    },
    evidence_total: 1,
    reports: [
      {
        id: '3e506dca-3ea1-4b18-9092-4b2617c2f050',
        kind: 'road_closure',
        title: 'Road closure direction not recorded',
        location: 'A fictional junction',
        route_id: 202,
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
        created_at: '2026-10-16T02:00:00Z',
        updated_at: '2026-10-16T02:05:00Z',
        actor_label: 'synthetic_example',
      },
    ],
    reports_next_cursor: null,
  },
  '0d29ca0f-3eec-4db4-b010-f4de81f66e3f': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: { state: 'not_affected', reason: 'No synthetic report matched the complete synthetic route reference. This does not confirm that the trip is clear.' },
    trip: { id: '0d29ca0f-3eec-4db4-b010-f4de81f66e3f', name: 'Synthetic no-match example', is_synthetic: true, segments: [
      { id: 5, ordinal: 1, mode: 'Bus', origin: 'Example origin', destination: 'Example destination', route_reference_available: true, route_data_quality: 'approximate', route_id: 303 },
    ] },
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

// The fixture follows the same normalized paginated interface as the HTTP adapter.
export const tripBriefFixtureApi = {
  async listTrips(_workspaceId, { signal } = {}) {
    await wait(signal)
    return { items: trips, next_cursor: null }
  },
  async getContext(_workspaceId, tripId, { signal } = {}) {
    await wait(signal)
    return contexts[tripId]
  },
}
