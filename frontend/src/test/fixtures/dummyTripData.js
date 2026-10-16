const trips = [
  { id: 'trip-mirpur-shahbagh', name: 'Mirpur 10 to Shahbagh', is_synthetic: true },
  { id: 'trip-uttara-farmgate', name: 'Uttara North to Farmgate', is_synthetic: true },
  { id: 'trip-no-match', name: 'Example with no matching reports', is_synthetic: true },
]

const contexts = {
  'trip-mirpur-shahbagh': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: { state: 'affects_trip', reason: 'A report matches the Farmgate road segment; direction is not confirmed.' },
    trip: { id: 'trip-mirpur-shahbagh', name: 'Mirpur 10 to Shahbagh', is_synthetic: true, segments: [
      { id: 'leg-1', mode: 'MRT-6', origin: 'Mirpur 10', destination: 'Farmgate', duration_minutes: 24, fare_bdt: 30 },
      { id: 'leg-2', mode: 'Walking', origin: 'Farmgate', destination: 'Farmgate bus stop', duration_minutes: 6, fare_bdt: 0 },
      { id: 'leg-3', mode: 'Bus', origin: 'Farmgate', destination: 'Shahbagh', duration_minutes: 18, fare_bdt: 10 },
    ] },
    reports: [{ id: 'report-farmgate', title: 'Waterlogging reported near Farmgate', location: 'Farmgate', mode: 'Road traffic', direction: null, observed_at: '2026-10-16T02:15:00Z', age_minutes: 15, freshness: 'current', source_type: 'traveller_report', status: 'reported', description: 'Water is collecting near the west-side crossing. Bus movement may be slower than usual.', confirmation_note: 'No second source is included in this example.', is_synthetic: true, version: 1 }],
  },
  'trip-uttara-farmgate': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: { state: 'unknown', reason: 'A potentially matching report is disputed, and its direction and observation time are unknown.' },
    trip: { id: 'trip-uttara-farmgate', name: 'Uttara North to Farmgate', is_synthetic: true, segments: [{ id: 'leg-4', mode: 'MRT-6', origin: 'Uttara North', destination: 'Farmgate', duration_minutes: 32, fare_bdt: 40 }] },
    reports: [{ id: 'report-unknown', title: 'Road closure direction not recorded', location: 'A fictional junction', mode: 'Road traffic', direction: null, observed_at: null, age_minutes: null, freshness: 'unknown', source_type: 'traveller_report', status: 'disputed', description: 'Missing time and direction keep this report from supporting a confident comparison.', confirmation_note: null, is_synthetic: true, version: 2 }],
  },
  'trip-no-match': {
    as_of: '2026-10-16T02:30:00Z',
    relevance: { state: 'not_affected', reason: 'No available report matched the known trip details. This does not confirm that the trip is clear.' },
    trip: { id: 'trip-no-match', name: 'Example with no matching reports', is_synthetic: true, segments: [{ id: 'leg-5', mode: 'Bus', origin: 'Badda', destination: 'Motijheel', duration_minutes: 35, fare_bdt: 25 }] },
    reports: [],
  },
}

export { contexts, trips }
