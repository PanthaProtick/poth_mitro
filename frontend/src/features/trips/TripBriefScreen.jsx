import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BusFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Info,
  MapPin,
  RefreshCw,
  TrainFront,
  WifiOff,
  Footprints,
} from 'lucide-react'
import IncidentEditor from './IncidentEditor'
import { clearTripContexts, readTripContext, saveTripContext } from '../../services/tripContextCache'

function formatTime(value) {
  if (!value) return 'Time not provided'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Time not provided'
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(parsed)
}

function tripLabel(trip) {
  return trip.label || trip.name || `${trip.origin || 'Unknown start'} to ${trip.destination || 'Unknown destination'}`
}

function apiResponded(error) {
  return Boolean(error.apiResponded || (error.status && error.status < 500))
}

function getResultState(context) {
  const state = context?.relevance?.state
  if (state === 'affects_trip') return 'affects'
  if (state === 'not_affected') return 'no-match'
  return 'unknown'
}

function ModeIcon({ mode }) {
  const value = (mode || '').toLowerCase()
  if (value.includes('mrt') || value.includes('metro') || value.includes('train')) return <TrainFront aria-hidden="true" />
  if (value.includes('walk')) return <Footprints aria-hidden="true" />
  return <BusFront aria-hidden="true" />
}

function InlineStatus({ kind, children, icon: Icon }) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {Icon ? <Icon aria-hidden="true" size={19} /> : null}
      <div>{children}</div>
    </div>
  )
}

export default function TripBriefScreen(props) {
  return <TripBriefContent key={`${props.workspaceId || 'no-workspace'}:${props.demo ? 'preview' : 'app'}`} {...props} />
}

function TripBriefContent({ api, workspaceId, workspaceName, demo = false }) {
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(() => {
    try { return demo ? '' : localStorage.getItem(`dhakapath:last-trip:${workspaceId || ''}`) || '' }
    catch { return '' }
  })
  const [context, setContext] = useState(null)
  const [lastFetchedAt, setLastFetchedAt] = useState(null)
  const [cacheRecord, setCacheRecord] = useState(null)
  const [tripCursor, setTripCursor] = useState(null)
  const [reportCursor, setReportCursor] = useState(null)
  const [failedTripCursor, setFailedTripCursor] = useState(null)
  const [reportPageError, setReportPageError] = useState(null)
  const [failedReportCursor, setFailedReportCursor] = useState(null)
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [loadingMoreTrips, setLoadingMoreTrips] = useState(false)
  const [loadingMoreReports, setLoadingMoreReports] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [tripError, setTripError] = useState(null)
  const [contextError, setContextError] = useState(null)
  const [stale, setStale] = useState(false)
  const [apiReachable, setApiReachable] = useState(null)
  const [apiReady, setApiReady] = useState(null)
  const [browserOnline, setBrowserOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [notice, setNotice] = useState('')
  const [savingReport, setSavingReport] = useState(false)
  const [contextRevision, setContextRevision] = useState(0)
  const requestRef = useRef(null)
  const reportsControllerRef = useRef(null)
  const restoreSelectionRef = useRef(Boolean(selectedTripId))
  const workspaceKey = workspaceId || ''

  const loadTrips = useCallback(async ({ signal, cursor = null, append = false } = {}) => {
    if (!workspaceKey) return
    try {
      const result = await api.listTrips(workspaceKey, { signal, cursor })
      if (signal?.aborted) return
      setApiReachable(true)
      setApiReady(true)
      setTripError(null)
      setFailedTripCursor(null)
      setTrips((current) => {
        const combined = append ? [...current, ...(result.items || [])] : (result.items || [])
        return [...new Map(combined.map((trip) => [trip.id, trip])).values()]
      })
      setTripCursor(result.next_cursor || null)
    } catch (error) {
      if (error.name !== 'AbortError') {
        setTripError(error)
        setFailedTripCursor(append && error.status !== 400 ? cursor : null)
        setApiReachable(apiResponded(error))
        if (!apiResponded(error) || error.status >= 500) setApiReady(false)
      }
    } finally {
      if (!signal?.aborted) { setLoadingTrips(false); setLoadingMoreTrips(false) }
    }
  }, [api, workspaceKey])

  const restoreCachedContext = useCallback(async (tripId) => {
    if (demo || !tripId) return false
    try {
      const record = await readTripContext(workspaceKey, tripId)
      if (!record) return false
      setContext(record.context)
      setCacheRecord(record)
      setLastFetchedAt(record.cached_at)
      setReportCursor(record.reports_next_cursor)
      setStale(true)
      setTrips((current) => current.some((trip) => trip.id === tripId) ? current : [...current, record.context.trip])
      return true
    } catch {
      setNotice('The saved trip copy could not be read from this browser. Local storage may be unavailable or full.')
      return false
    }
  }, [demo, workspaceKey])

  const loadContext = useCallback(async (tripId, { reportCursor: cursor = null, append = false } = {}) => {
    if (!workspaceKey || !tripId) return
    if (!append) requestRef.current?.abort()
    else reportsControllerRef.current?.abort()
    const controller = new AbortController()
    if (append) reportsControllerRef.current = controller
    else requestRef.current = controller
    if (append) { setLoadingMoreReports(true); setReportPageError(null) }
    else { setLoadingContext(true); setLoadingMoreReports(false); setContextError(null); setReportPageError(null); setFailedReportCursor(null); setNotice('') }
    try {
      const result = await api.getContext(workspaceKey, tripId, { signal: controller.signal, reportCursor: cursor })
      if (controller.signal.aborted) return
      setApiReachable(true)
      setApiReady(true)
      setContext((current) => {
        if (!append) return result
        if (!current || current.trip?.id !== tripId) return current
        const merged = [...current.reports, ...(result.reports || [])]
        return { ...current, reports: [...new Map(merged.map((report) => [report.id, report])).values()], reports_next_cursor: result.reports_next_cursor }
      })
      const nextCursor = result.reports_next_cursor || null
      setReportCursor(nextCursor)
      setFailedReportCursor(null)
      const mergedContext = append && context?.trip?.id === tripId
        ? { ...context, reports: [...new Map([...(context.reports || []), ...(result.reports || [])].map((report) => [report.id, report])).values()], reports_next_cursor: nextCursor }
        : result
      const fetchedAt = new Date().toISOString()
      setLastFetchedAt(fetchedAt)
      if (!append) setContextRevision((value) => value + 1)
      if (!demo) saveTripContext(workspaceKey, tripId, mergedContext)
        .then(setCacheRecord)
        .catch(() => setNotice('Trip data loaded, but this browser could not save its offline copy.'))
      setStale(false)
    } catch (error) {
      if (error.name === 'AbortError') return
      setApiReachable(apiResponded(error))
      if (!apiResponded(error) || error.status >= 500) setApiReady(false)
      if (append) {
        setReportPageError(error)
        setFailedReportCursor(error.status === 400 ? null : cursor)
        if (!error.status || error.status >= 500) setStale(true)
      } else {
        setContextError(error)
        if (context?.trip?.id === tripId) setStale(true)
        else if (!error.status || error.status >= 500) await restoreCachedContext(tripId)
        else if (error.status === 404) {
          setSelectedTripId('')
          setStale(false)
          try { localStorage.removeItem(`dhakapath:last-trip:${workspaceKey}`) } catch { /* Selection still clears in this tab. */ }
        }
      }
    } finally {
      if (!controller.signal.aborted) { setLoadingContext(false); setLoadingMoreReports(false) }
    }
  }, [api, context, demo, restoreCachedContext, workspaceKey])

  useEffect(() => {
    const controller = new AbortController()
    requestRef.current?.abort()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) loadTrips({ signal: controller.signal })
    })
    return () => {
      controller.abort()
      requestRef.current?.abort()
    }
  }, [workspaceKey, loadTrips])

  useEffect(() => {
    if (loadingTrips || !restoreSelectionRef.current || !selectedTripId || context?.trip?.id === selectedTripId) return
    restoreSelectionRef.current = false
    void loadContext(selectedTripId)
  }, [loadingTrips, selectedTripId, context, loadContext])

  useEffect(() => {
    const onOnline = () => { setBrowserOnline(true); setNotice('Browser reports a network connection. Checking the local service still requires Refresh.') }
    const onOffline = () => { setBrowserOnline(false) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId)
  const resultState = getResultState(context)
  const reports = context?.reports || []
  const resultCopy = {
    affects: {
      title: 'May affect this trip',
      body: context?.relevance?.reason || context?.relevance_reason || 'A saved report overlaps with a known part of this trip. Review its time and location below.',
      icon: AlertTriangle,
    },
    'no-match': {
      title: 'No match found in available reports',
      body: context?.relevance?.reason || context?.relevance_reason || 'No available report matched the known trip details. This does not confirm that the trip is clear.',
      icon: Check,
    },
    unknown: {
      title: 'Not enough information',
      body: context?.relevance?.reason || context?.relevance_reason || 'The available trip or report details are incomplete or conflicting, so the app cannot make a supported comparison.',
      icon: CircleHelp,
    },
  }[resultState]

  function handleTripChange(event) {
    const nextId = event.target.value
    restoreSelectionRef.current = false
    requestRef.current?.abort()
    reportsControllerRef.current?.abort()
    setSelectedTripId(nextId)
    if (!demo) {
      try { localStorage.setItem(`dhakapath:last-trip:${workspaceKey}`, nextId) } catch { /* Selection still works for this tab. */ }
    }
    setContext(null)
    setLastFetchedAt(null)
    setLoadingContext(false)
    setLoadingMoreReports(false)
    setCacheRecord(null)
    setReportCursor(null)
    setReportPageError(null)
    setFailedReportCursor(null)
    setContextError(null)
    setStale(false)
    setNotice('')
  }

  async function handleCheck() {
    if (!selectedTripId) return
    await loadContext(selectedTripId)
  }

  async function handleSaveReport({ reportId, payload, idempotencyKey }) {
    if (apiReady !== true) {
      const unavailable = new Error('The local API is unavailable. Refresh the trip before submitting a write.')
      unavailable.status = 503
      unavailable.unknownOutcome = false
      throw unavailable
    }
    setSavingReport(true)
    try {
      if (reportId) await api.updateReport(reportId, payload, idempotencyKey)
      else await api.createReport(payload, idempotencyKey)
      setApiReachable(true)
      setApiReady(true)
      await loadContext(selectedTripId)
    } catch (error) {
      setApiReachable(apiResponded(error))
      if (!apiResponded(error) || error.status >= 500) setApiReady(false)
      throw error
    } finally {
      setSavingReport(false)
    }
  }

  async function handleRefresh(reportId = null) {
    if (!selectedTripId) return null
    await loadContext(selectedTripId)
    if (reportId && api.getReport) {
      try {
        const latest = await api.getReport(reportId)
        setApiReachable(true)
        setApiReady(true)
        return latest
      } catch { return null }
    }
    return null
  }

  function handleRetryTrips() {
    setTripError(null)
    if (failedTripCursor) {
      setLoadingMoreTrips(true)
      void loadTrips({ cursor: failedTripCursor, append: true })
    } else {
      setLoadingTrips(true)
      void loadTrips()
    }
  }

  function handleLoadMoreTrips() {
    if (!tripCursor || loadingMoreTrips) return
    setLoadingMoreTrips(true)
    void loadTrips({ cursor: tripCursor, append: true })
  }

  function handleLoadMoreReports() {
    if (!reportCursor || loadingMoreReports || !selectedTripId) return
    void loadContext(selectedTripId, { reportCursor, append: true })
  }

  function handleRetryReports() {
    if (failedReportCursor) void loadContext(selectedTripId, { reportCursor: failedReportCursor, append: true })
    else void loadContext(selectedTripId)
  }

  async function handleClearCache() {
    try {
      await clearTripContexts(workspaceKey)
      setCacheRecord(null)
      setNotice('Saved trip copies were cleared from this browser.')
    } catch { setNotice('This browser could not clear its saved trip copies.') }
  }

  const tripSegments = context?.trip?.segments || []
  const routeOptions = [...new Map(tripSegments
    .filter((segment) => segment.route_id != null)
    .map((segment) => [segment.route_id, {
      id: segment.route_id,
      label: `${segment.mode || 'Route'} · ${segment.origin} to ${segment.destination}`,
    }])).values()]
  const reportsEmpty = context && reports.length === 0
  const ResultIcon = resultCopy.icon

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to trip information</a>
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="DhakaPath home">
            <span className="brand-mark"><MapPin size={20} aria-hidden="true" /></span>
            <span>DhakaPath</span>
          </a>
          <div className="account-context">
            <div className="workspace-caption">{demo ? 'SYNTHETIC PREVIEW' : 'LOCAL ACCESS'}</div>
            <div className="workspace-name">{demo ? workspaceName || 'Synthetic local preview' : 'This device only'}</div>
          </div>
        </div>
      </header>

      <main id="main-content" className="main-content">
        <div className="page-intro">
          <div>
            <p className="eyebrow">TRIP INFORMATION</p>
            <h1>Trip brief</h1>
            <p className="intro-copy">{demo ? 'Synthetic fixture data for visual review only; this preview does not write to the local API.' : 'Use this prototype from this computer. Trip and report details come from its local database.'}</p>
          </div>
          {demo ? <span className="demo-chip"><Info size={15} aria-hidden="true" /> Synthetic preview</span> : null}
        </div>

        {!workspaceKey ? (
          <section className="access-panel" aria-labelledby="access-title">
            <div className="access-icon"><CircleHelp size={22} aria-hidden="true" /></div>
            <div>
              <h2 id="access-title">Local-only prototype</h2>
              <p>This app is intended for one operator on this computer. It has no sign-in or shared workspace.</p>
            </div>
          </section>
        ) : (
          <>
            {notice ? <p className="sr-only" role="status">{notice}</p> : null}
            <p className="service-hint" role="status">{demo ? 'Data source: synthetic local preview fixture' : `Local API: ${apiReachable === true ? 'reachable' : apiReachable === false ? 'unreachable' : 'checking'} · Readiness: ${apiReady === true ? 'ready' : apiReady === false ? 'unavailable' : 'unknown'}`} · Browser network hint: {browserOnline ? 'online' : 'offline'} (informational only)</p>

            <section className="trip-picker-panel" aria-labelledby="trip-picker-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR JOURNEY</p>
                  <h2 id="trip-picker-title">Choose a trip</h2>
                </div>
                {context ? (
                  <button className="button button-quiet" onClick={() => handleRefresh()} disabled={loadingContext}>
                    <RefreshCw size={17} aria-hidden="true" className={loadingContext ? 'spin' : ''} />
                    <span>Refresh</span>
                  </button>
                ) : null}
              </div>

              <label className="field-label" htmlFor="trip-select">Prepared trip</label>
              <div className="select-wrap">
                <select id="trip-select" value={selectedTripId} onChange={handleTripChange} disabled={loadingTrips || trips.length === 0}>
                  <option value="">{loadingTrips ? 'Loading trips…' : 'Select a trip'}</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{tripLabel(trip)}</option>)}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>
              {tripError ? (
                <div className="inline-error" role="alert">
                  <span>{tripError.status === 400 ? 'The trip-list cursor was invalid or expired; restart from the first page.' : failedTripCursor ? 'The next trip page could not be loaded from the local service.' : 'The local trip list could not be loaded.'}</span>
                  <button className="text-button" onClick={handleRetryTrips}>{tripError.status === 400 ? 'Reload trips' : 'Try again'}</button>
                </div>
              ) : null}
              {tripCursor ? <button className="button button-quiet" onClick={handleLoadMoreTrips} disabled={loadingMoreTrips || Boolean(tripError)}>{loadingMoreTrips ? 'Loading trips…' : 'Load more trips'}</button> : null}
              {trips.length === 0 && !loadingTrips && !tripError ? (
                <p className="helper-copy">No prepared trips are available yet.</p>
              ) : null}
              <div className="check-row">
                <p className="helper-copy">The comparison uses saved trip and report details.</p>
                <button className="button button-primary" onClick={handleCheck} disabled={!selectedTripId || loadingContext}>
                  {loadingContext ? <RefreshCw size={17} aria-hidden="true" className="spin" /> : <ArrowRight size={17} aria-hidden="true" />}
                  <span>{loadingContext ? 'Checking…' : 'Check this trip'}</span>
                </button>
              </div>
            </section>

            {contextError && !context ? (
              <InlineStatus kind="error" icon={AlertTriangle}>
                <strong>Trip information is unavailable right now.</strong>
                <span> No new result is available. Try again when the connection or access issue is resolved.</span>
              </InlineStatus>
            ) : null}

            {context ? (
              <>
              <div className="brief-grid" aria-live="polite" aria-busy={loadingContext}>
                <section className={`result-card result-${resultState}`} aria-labelledby="result-title">
                  {stale || contextError ? (
                    <div className="stale-strip" role={contextError ? 'alert' : 'status'}>
                      {apiReachable === false ? <WifiOff size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
                      <span><strong>{apiReady === false ? 'Local API unavailable — showing the last successful result' : 'Refresh failed — showing the last successful result'}</strong> · Cached {formatTime(cacheRecord?.cached_at || lastFetchedAt || context.as_of)}; server checked {formatTime(context.as_of)}. This copy is stale.</span>
                    </div>
                  ) : null}
                  <div className="result-content">
                    <div className="result-symbol"><ResultIcon size={23} aria-hidden="true" /></div>
                    <div>
                      <p className="eyebrow">TRIP CHECK</p>
                      <h2 id="result-title">{resultCopy.title}</h2>
                      <p className="result-explanation">{resultCopy.body}</p>
                    </div>
                  </div>
                  {!demo && cacheRecord ? <button className="text-button cache-clear" onClick={handleClearCache}>Clear saved trip copies</button> : null}
                  <div className="result-meta">
                    <span><Clock3 size={15} aria-hidden="true" /> Server checked {formatTime(context.as_of)} · Loaded {formatTime(lastFetchedAt || context.as_of)}</span>
                    {demo ? <span className="data-origin">Synthetic example</span> : null}
                  </div>
                </section>

                <section className="journey-card" aria-labelledby="journey-title">
                  <div className="section-heading compact-heading">
                    <div>
                      <p className="eyebrow">ORDERED LEGS</p>
                      <h2 id="journey-title">{context.trip?.name || tripLabel(selectedTrip || {})}</h2>
                    </div>
                    {selectedTrip?.is_synthetic || context.trip?.is_synthetic ? <span className="synthetic-label">Synthetic data</span> : null}
                  </div>
                  {tripSegments.length ? (
                    <ol className="segment-list">
                      {tripSegments.map((segment, index) => (
                        <li className="segment-item" key={segment.id || `${segment.mode}-${index}`}>
                          <span className="mode-icon"><ModeIcon mode={segment.mode} /></span>
                          <div className="segment-copy">
                            <span className="segment-mode">{segment.mode || 'Mode not provided'}</span>
                            <span className="segment-route">{segment.origin || 'Start not provided'} <ArrowRight size={14} aria-hidden="true" /> {segment.destination || 'End not provided'}</span>
                            {segment.route_reference_available === false ? <span className="helper-copy">Route reference unavailable; this leg is not checked against route-linked reports.</span> : segment.route_data_quality === 'approximate' ? <span className="helper-copy">Approximate stored route reference</span> : null}
                          </div>
                          {index < tripSegments.length - 1 ? <ArrowDown className="segment-down" size={16} aria-hidden="true" /> : null}
                        </li>
                      ))}
                    </ol>
                  ) : <p className="empty-copy">Trip segments were not included in the available response.</p>}
                </section>

                <section className="evidence-card" aria-labelledby="evidence-title">
                  <div className="section-heading compact-heading">
                    <div>
                      <p className="eyebrow">REPORT EVIDENCE</p>
                      <h2 id="evidence-title">What this check used</h2>
                    </div>
                  </div>
                  {reportsEmpty ? (
                    <div className="empty-report">
                      <Info size={19} aria-hidden="true" />
                      <p>No matching reports were returned as of {formatTime(context.as_of)}. This does not confirm that the trip is clear.</p>
                    </div>
                  ) : (
                    <ul className="report-list">
                      {reports.map((report) => (
                        <li key={report.id} className="report-item">
                          <div className="report-topline">
                            <h3>{report.title || report.location || 'Disruption report'}</h3>
                            {report.is_synthetic || demo ? <span className="synthetic-label">Synthetic example</span> : null}
                          </div>
                          <dl className="evidence-fields">
                            <div><dt>Location</dt><dd>{report.location || 'Not provided'}</dd></div>
                            <div><dt>Mode / direction</dt><dd>{[report.mode, report.direction].filter(Boolean).join(' · ') || 'Not provided'}</dd></div>
                            <div><dt>Observed</dt><dd>{formatTime(report.observed_at)} · {report.age_minutes == null ? report.freshness : `${report.age_minutes} min · ${report.freshness}`}</dd></div>
                            <div><dt>Source</dt><dd>{report.source_type || 'Not provided'}</dd></div>
                            <div><dt>Report state</dt><dd>{report.status || 'Unknown'}</dd></div>
                          </dl>
                          {report.description ? <p className="report-description">{report.description}</p> : null}
                          {report.confirmation_note ? <p className="report-note"><Info size={15} aria-hidden="true" />{report.confirmation_note}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="helper-copy">Showing {reports.length} of {context.evidence_total} reports{reportCursor ? ' · more server pages are available' : ' · all report pages loaded'}{stale && cacheRecord && !cacheRecord.reports_complete ? ' (the saved copy was partial)' : ''}.</p>
                  {reportPageError ? <div className="inline-error" role="alert"><span>{reportPageError.status === 400 ? 'The report cursor expired or was invalid.' : 'The next report page could not be loaded.'}</span><button className="text-button" onClick={handleRetryReports}>{failedReportCursor ? 'Try again' : 'Reload report evidence'}</button></div> : null}
                  {reportCursor ? <button className="button button-quiet" onClick={handleLoadMoreReports} disabled={loadingMoreReports || stale || Boolean(reportPageError)}>{loadingMoreReports ? 'Loading reports…' : 'Load more reports'}</button> : null}
                  <p className="provenance-note"><Info size={15} aria-hidden="true" /> The result compares the available saved details. It does not independently verify a report or guarantee route safety.</p>
                </section>
              </div>
              <IncidentEditor
                reports={reports}
                routeOptions={routeOptions}
                onSubmit={handleSaveReport}
                pending={savingReport}
                enabled={!demo && apiReady === true && !stale}
                apiUnavailable={apiReady !== true || stale}
                onRefresh={handleRefresh}
                contextRevision={contextRevision}
                scopeId={workspaceKey}
                tripId={selectedTripId}
                canReconcile={apiReady === true && !stale}
              />
              </>
            ) : null}

            <p className="page-footnote">Reports can become outdated. Check the observation time and source before relying on a claim.</p>
          </>
        )}
      </main>
    </div>
  )
}
