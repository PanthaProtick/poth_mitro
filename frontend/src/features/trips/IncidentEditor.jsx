import { useState } from 'react'

const initial = { title: '', location: '', mode: 'Road traffic', direction: null, observed_at: null, source_type: 'traveller_report', description: '' }

export default function IncidentEditor({ onSubmit, pending, error, role }) {
  const [draft, setDraft] = useState(initial)
  const [editId, setEditId] = useState('')
  const [reason, setReason] = useState('')
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value === '' ? null : value }))
  const submit = async (event) => { event.preventDefault(); await onSubmit({ draft, editId, reason }); if (!error) { setDraft(initial); setEditId(''); setReason('') } }
  if (role !== 'admin') return <div className="view-only-note">Report editing is available to workspace admins. You have read-only access.</div>
  return <form className="editor-form" onSubmit={submit} aria-labelledby="editor-title">
    <div className="section-heading compact-heading"><div><p className="eyebrow">ADMIN ACTION</p><h2 id="editor-title">Report an update</h2></div><span className="synthetic-label">Dummy data</span></div>
    <div className="form-grid">
      <label>Title<input required value={draft.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Waterlogging near Farmgate" /></label>
      <label>Location<input required value={draft.location} onChange={(e) => update('location', e.target.value)} placeholder="Intersection or landmark" /></label>
      <label>Mode<select value={draft.mode || ''} onChange={(e) => update('mode', e.target.value)}><option>Road traffic</option><option>Bus</option><option>MRT-6</option><option>Walking</option></select></label>
      <label>Direction (optional)<input value={draft.direction || ''} onChange={(e) => update('direction', e.target.value)} placeholder="e.g. northbound" /></label>
      <label className="wide">Description<textarea value={draft.description || ''} onChange={(e) => update('description', e.target.value)} rows="3" placeholder="What did you observe?" /></label>
      <label className="wide">Edit existing report ID (optional)<input value={editId} onChange={(e) => setEditId(e.target.value)} placeholder="Leave blank to create a new report" /></label>
      {editId ? <label className="wide">Reason for edit<input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the correction" /></label> : null}
    </div>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="editor-actions"><p className="helper-copy">Dummy submissions are kept in this browser session only.</p><button className="button button-primary" disabled={pending}>{pending ? 'Saving…' : editId ? 'Update report' : 'Create report'}</button></div>
  </form>
}
