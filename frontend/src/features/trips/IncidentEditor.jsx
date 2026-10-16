import { useRef, useState } from 'react'
import { Info } from 'lucide-react'

const nowLocal = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

const emptyDraft = () => ({
  kind: 'disruption',
  title: '',
  description: '',
  location: '',
  mode: 'Road traffic',
  direction: '',
  route_id: '',
  observed_at: nowLocal(),
  source_type: 'traveller_report',
  status: 'reported',
  confirmation_note: '',
})

function draftFromReport(report) {
  return {
    ...emptyDraft(),
    ...report,
    route_id: report.route_id == null ? '' : String(report.route_id),
    observed_at: report.observed_at ? new Date(report.observed_at).toISOString().slice(0, 16) : '',
  }
}

function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function pendingStorageKey(scopeId, tripId) {
  return `dhakapath:unknown-mutation:v1:${scopeId}:${tripId}`
}

function readPendingAttempt(scopeId, tripId) {
  try {
    const record = JSON.parse(sessionStorage.getItem(pendingStorageKey(scopeId, tripId)) || 'null')
    if (record?.schema_version !== 1 || record.scope_id !== scopeId || record.trip_id !== tripId
      || typeof record.key !== 'string' || typeof record.signature !== 'string' || !record.payload) return null
    return record
  } catch { return null }
}

function toPayload(draft) {
  const observed = draft.observed_at ? new Date(draft.observed_at).toISOString() : null
  return {
    kind: draft.kind.trim(),
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    location: draft.location.trim(),
    mode: draft.mode.trim(),
    direction: draft.direction.trim() || null,
    route_id: draft.route_id ? Number(draft.route_id) : null,
    observed_at: observed,
    source_type: draft.source_type,
  }
}

export default function IncidentEditor({ reports, routeOptions, onSubmit, pending, enabled, apiUnavailable, onRefresh, contextRevision, scopeId, tripId, canReconcile }) {
  const storageKey = pendingStorageKey(scopeId, tripId)
  const [restoredAttempt] = useState(() => readPendingAttempt(scopeId, tripId))
  const [draft, setDraft] = useState(() => restoredAttempt
    ? { ...emptyDraft(), ...restoredAttempt.payload, route_id: restoredAttempt.payload.route_id == null ? '' : String(restoredAttempt.payload.route_id), observed_at: localDateTime(restoredAttempt.payload.observed_at) }
    : emptyDraft())
  const [editId, setEditId] = useState(() => restoredAttempt?.report_id || '')
  const [reason, setReason] = useState(() => restoredAttempt?.payload?.reason || '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [unknownOutcome, setUnknownOutcome] = useState(Boolean(restoredAttempt))
  const [unknownAtRevision, setUnknownAtRevision] = useState(() => restoredAttempt ? contextRevision - 1 : null)
  const [conflictAtRevision, setConflictAtRevision] = useState(null)
  const [conflictReviewed, setConflictReviewed] = useState(false)
  const [refreshedReport, setRefreshedReport] = useState(null)
  const attemptRef = useRef(restoredAttempt ? {
    signature: restoredAttempt.signature,
    payload: restoredAttempt.payload,
    key: restoredAttempt.key,
  } : null)
  const selectedReport = reports.find((report) => report.id === editId)
    || (refreshedReport?.id === editId ? refreshedReport : null)

  const unknownReconciled = canReconcile && unknownAtRevision != null && contextRevision > unknownAtRevision
  const conflictRefreshed = canReconcile && conflictAtRevision != null && contextRevision > conflictAtRevision

  function chooseReport(id) {
    if (unknownOutcome) return
    setEditId(id)
    setReason('')
    setError('')
    setSaved(false)
    setUnknownOutcome(false)
    setUnknownAtRevision(null)
    setConflictAtRevision(null)
    setConflictReviewed(false)
    setRefreshedReport(null)
    attemptRef.current = null
    const report = reports.find((item) => item.id === id)
    setDraft(report ? draftFromReport(report) : emptyDraft())
  }

  function update(key, value) {
    if (unknownOutcome) return
    setSaved(false)
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const payload = toPayload(draft)
    if (!payload.observed_at) {
      setError('Add when the disruption was observed. This helps the app show how old the report is.')
      return
    }
    if (editId && !(unknownOutcome && attemptRef.current)) {
      if (conflictAtRevision != null && (!conflictRefreshed || !conflictReviewed)) {
        setError('Refresh the report, review the latest server version, then explicitly approve using it before saving.')
        return
      }
      payload.expected_version = selectedReport.version
      payload.reason = reason.trim()
      payload.status = draft.status
      payload.confirmation_note = draft.confirmation_note.trim() || null
      delete payload.source_type
    }
    let requestPayload = payload
    let signature = JSON.stringify({ reportId: editId || null, payload })
    if (unknownOutcome && attemptRef.current) {
      requestPayload = attemptRef.current.payload
      signature = attemptRef.current.signature
    } else if (attemptRef.current?.signature !== signature) {
      attemptRef.current = { signature, payload: structuredClone(payload), key: crypto.randomUUID() }
    }
    try {
      await onSubmit({ reportId: editId, payload: requestPayload, idempotencyKey: attemptRef.current.key })
      setSaved(true)
      attemptRef.current = null
      try { sessionStorage.removeItem(storageKey) } catch { /* Session storage may be unavailable. */ }
      if (!editId) setDraft(emptyDraft())
    } catch (saveError) {
      if (saveError.unknownOutcome || (!saveError.status && saveError.name !== 'AbortError')) {
        setUnknownOutcome(true)
        setUnknownAtRevision(contextRevision)
        try {
          sessionStorage.setItem(storageKey, JSON.stringify({
            schema_version: 1, scope_id: scopeId, trip_id: tripId,
            report_id: editId || null, key: attemptRef.current.key,
            signature: attemptRef.current.signature, payload: attemptRef.current.payload,
          }))
        } catch { /* The in-memory identical retry remains available for this page. */ }
      }
      if (saveError.code === 'VERSION_CONFLICT') {
        setConflictAtRevision(contextRevision)
        setConflictReviewed(false)
      }
      setError(saveError)
    }
  }

  async function refreshAndReview() {
    try {
      const latest = await onRefresh?.(editId || null)
      if (latest) setRefreshedReport(latest)
    } catch { /* Keep the draft and unresolved state; the parent shows API availability. */ }
  }

  return (
    <section className="report-editor-card" aria-labelledby="report-editor-title">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">LOCAL OPERATOR</p>
          <h2 id="report-editor-title">Add or correct a report</h2>
        </div>
      </div>
      {!enabled ? (
        <p className="helper-copy">{apiUnavailable ? 'Report changes are disabled because the local API is unavailable. Refresh after it recovers; offline writes are never queued.' : 'Report changes are disabled in the synthetic preview.'}</p>
      ) : (
        <>
          <p className="report-editor-intro">Saved reports are written to this computer’s SQLite database. A route link lets the report appear in trip checks that use that route.</p>
          {routeOptions.length === 0 ? <p className="editor-error" role="status">This trip has no stored route reference, so this screen cannot file a report that will appear in its trip checks.</p> : null}
          <form className="report-editor-form" onSubmit={submit}>
            <fieldset className="editor-fields" disabled={pending || unknownOutcome || (conflictAtRevision != null && !conflictReviewed)}>
            <label className="editor-field editor-wide">Correct an existing report (optional)
              <select value={editId} onChange={(event) => chooseReport(event.target.value)} disabled={pending || unknownOutcome}>
                <option value="">Create a new report</option>
                {reports.filter((report) => !report.is_synthetic).map((report) => (
                  <option key={report.id} value={report.id}>{report.title} · v{report.version}</option>
                ))}
              </select>
            </label>
            <label className="editor-field">Disruption type
              <input required maxLength="80" value={draft.kind} onChange={(event) => update('kind', event.target.value)} />
            </label>
            <label className="editor-field">Title
              <input required maxLength="160" value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Waterlogging near Farmgate" />
            </label>
            <label className="editor-field">Location
              <input required maxLength="200" value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="Intersection or landmark" />
            </label>
            <label className="editor-field">Mode
              <input required maxLength="80" value={draft.mode || ''} onChange={(event) => update('mode', event.target.value)} placeholder="Bus, MRT-6, road traffic…" />
            </label>
            <label className="editor-field">Route used by this trip
              <select required value={draft.route_id} onChange={(event) => update('route_id', event.target.value)} disabled={routeOptions.length === 0}>
                <option value="">Choose a route</option>
                {routeOptions.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}
              </select>
            </label>
            <label className="editor-field">Observed at
              <input required type="datetime-local" value={draft.observed_at || ''} onChange={(event) => update('observed_at', event.target.value)} />
            </label>
            <label className="editor-field">Direction (optional)
              <input maxLength="120" value={draft.direction || ''} onChange={(event) => update('direction', event.target.value)} placeholder="e.g. northbound" />
            </label>
            {!editId ? (
              <label className="editor-field">Report source
                <select value={draft.source_type} onChange={(event) => update('source_type', event.target.value)}>
                  <option value="traveller_report">Traveller report</option>
                  <option value="operator_notice">Operator notice</option>
                  <option value="staff_observation">Staff observation</option>
                </select>
              </label>
            ) : null}
            <label className="editor-field editor-wide">Description (optional)
              <textarea maxLength="2000" rows="3" value={draft.description || ''} onChange={(event) => update('description', event.target.value)} placeholder="What did you observe?" />
            </label>
            {editId ? (
              <>
                <label className="editor-field">Report state
                  <select value={draft.status} onChange={(event) => update('status', event.target.value)}>
                    <option value="reported">Reported</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="disputed">Disputed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
                <label className="editor-field">Confirmation note (optional)
                  <input maxLength="1000" value={draft.confirmation_note || ''} onChange={(event) => update('confirmation_note', event.target.value)} />
                </label>
                <label className="editor-field editor-wide">Reason for correction
                  <input required maxLength="500" value={reason} onChange={(event) => { setReason(event.target.value); setSaved(false) }} placeholder="Explain what changed" />
                </label>
              </>
            ) : null}
            </fieldset>
            {unknownOutcome ? <p className="editor-error" role="status">A prior write has an unknown outcome. Its exact request is restored from this tab's session storage; it has not been replayed.</p> : null}
            {error ? <div className="editor-error" role="alert">
              <p>{typeof error === 'string' ? error : error.message}</p>
              {Array.isArray(error?.fields) ? <ul>{error.fields.map((field, index) => <li key={`${field.name}-${index}`}><strong>{field.name}:</strong> {field.issue}</li>)}</ul> : null}
              {error?.status === 409 ? <p>Refresh and compare the current report. Your draft remains here; it will not be rebased automatically.</p> : null}
              {unknownOutcome ? <div className="unknown-actions"><button className="text-button" type="button" onClick={refreshAndReview}>Refresh and reconcile before changing this draft</button><span>Retrying Save sends the same payload with the same idempotency key.</span>{unknownReconciled ? <button className="text-button" type="button" onClick={() => { setUnknownOutcome(false); setUnknownAtRevision(null); setError(''); attemptRef.current = null; try { sessionStorage.removeItem(storageKey) } catch { /* The recovery record is best-effort browser storage. */ } }}>I reviewed the refreshed reports; allow a new attempt</button> : null}</div> : null}
              {conflictAtRevision != null ? <div className="unknown-actions"><button className="text-button" type="button" onClick={refreshAndReview}>Refresh latest report version</button>{conflictRefreshed && !conflictReviewed && selectedReport ? <button className="text-button" type="button" onClick={() => { setConflictReviewed(true); setError('') }}>I reviewed v{selectedReport.version}; use this version</button> : null}</div> : null}
            </div> : null}
            {conflictReviewed ? <p className="editor-saved" role="status">Reviewed the latest server version v{selectedReport?.version}. Saving now creates a new update from your preserved draft.</p> : null}
            {saved ? <p className="editor-saved" role="status">Saved. Refresh the trip context before relying on the updated result.</p> : null}
            <div className="editor-form-footer">
              <p className="editor-caveat"><Info size={15} aria-hidden="true" /> Reports are operator-entered evidence, not independently verified facts.</p>
              <button className="button button-primary" type="submit" disabled={!enabled || pending || routeOptions.length === 0 || (editId && !selectedReport && !unknownOutcome)}>
                {pending ? 'Saving…' : unknownOutcome ? 'Retry same save' : editId ? 'Save correction' : 'Save report'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
