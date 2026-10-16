import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, CircleDollarSign, Clock3, MapPin, MessageCircle, Plus, RotateCcw, ShieldCheck, Sparkles, TrainFront } from 'lucide-react'
import { chatApi, ChatApiError } from '../../services/chatApi'

const STORAGE_KEY = 'poth-mitro-chat-session-v1'
const PROVIDER_KEY = 'poth-mitro-chat-provider-v1'
const suggestions = [
  { icon: MapPin, text: 'From Mirpur 10 to Shahbagh', label: 'Find a route' },
  { icon: CircleDollarSign, text: 'How much is the fare from Mirpur 10 to Shahbagh?', label: 'Ask about fares' },
  { icon: ShieldCheck, text: 'Any reports near Dhanmondi?', label: 'Check reports' },
  { icon: MessageCircle, text: 'Report waterlogging at Dhanmondi', label: 'Report an issue' },
]

function dateLabel(value) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}

function MessageBubble({ message, onShowJourney }) {
  const isAssistant = message.role === 'assistant'
  return <article className={`chat-message ${isAssistant ? 'assistant-message' : 'user-message'}`}>
    {isAssistant ? <span className="chat-avatar"><Bot size={17} /></span> : null}
    <div className="chat-bubble-wrap">
      <div className="chat-bubble">{message.content.split('\n').map((line, index) => <span key={`${message.id}-${index}`}>{line || '\u00a0'}</span>)}
        {message.journey ? <div className="chat-route-result"><strong>{message.journey.options.length} graph path{message.journey.options.length === 1 ? '' : 's'} found</strong><span>{message.journey.origin.name} → {message.journey.destination.name}</span><button onClick={() => onShowJourney?.(message.journey)}><MapPin size={13} /> Highlight in planner map</button></div> : null}
      </div>
      <time dateTime={message.created_at}>{dateLabel(message.created_at)}</time>
    </div>
  </article>
}

export default function ChatScreen({ onShowJourney }) {
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [provider, setProvider] = useState('deterministic')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const mountedRef = useRef(false)
  const requestRef = useRef(null)

  const startSession = useCallback(async (signal) => {
    const created = await chatApi.createSession({ signal })
    if (signal.aborted) return
    setSessionId(created.session.id)
    setProvider(created.provider)
    sessionStorage.setItem(STORAGE_KEY, created.session.id)
    sessionStorage.setItem(PROVIDER_KEY, created.provider)
    setMessages([])
  }, [])

  const initialize = useCallback(async (signal) => {
    let savedId = sessionStorage.getItem(STORAGE_KEY)
    if (savedId) {
      try {
        const history = await chatApi.listMessages(savedId, { signal })
        if (signal.aborted) return
        setSessionId(savedId)
        setMessages(history)
        setProvider(sessionStorage.getItem(PROVIDER_KEY) || 'deterministic')
        setLoading(false)
        return
      } catch (loadError) {
        if (loadError.name === 'AbortError') return
        if (!(loadError instanceof ChatApiError) || loadError.status !== 404) {
          setError(`The local assistant could not load this conversation. ${loadError.message}`)
          setLoading(false)
          return
        }
        sessionStorage.removeItem(STORAGE_KEY)
        savedId = ''
      }
    }
    try {
      await startSession(signal)
    } catch (createError) {
      if (createError.name !== 'AbortError') setError(`The local assistant is unavailable. ${createError.message}`)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [startSession])

  useEffect(() => {
    const controller = new AbortController()
    requestRef.current = controller
    mountedRef.current = true
    void Promise.resolve().then(() => initialize(controller.signal))
    return () => {
      mountedRef.current = false
      controller.abort()
    }
  }, [initialize])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending, loading])

  const send = async (value = draft) => {
    const text = value.trim()
    if (!text || !sessionId || sending || loading) return
    setSending(true)
    setError('')
    setNotice('')
    setDraft('')
    const controller = new AbortController()
    requestRef.current = controller
    try {
      const result = await chatApi.sendMessage(sessionId, text, { signal: controller.signal })
      if (!mountedRef.current || controller.signal.aborted) return
      setMessages((current) => [...current, result.user_message, { ...result.assistant_message, journey: result.data?.journey || null }])
      setProvider(result.provider)
      sessionStorage.setItem(PROVIDER_KEY, result.provider)
    } catch (sendError) {
      if (sendError.name !== 'AbortError') {
        if (!sendError.status || sendError.status >= 500) {
          try {
            const history = await chatApi.listMessages(sessionId)
            if (!mountedRef.current) return
            setMessages(history)
            const lastUser = [...history].reverse().find((message) => message.role === 'user')
            const lastAssistant = [...history].reverse().find((message) => message.role === 'assistant')
            if (lastUser?.content === text && lastAssistant) {
              setNotice('The message was saved; its reply was recovered from conversation history.')
              return
            }
          } catch { /* Preserve the draft when the saved outcome cannot be reconciled. */ }
        }
        setDraft(text)
        setError(sendError.status === 404
          ? 'This conversation expired. Start a new conversation to continue.'
          : `Message was not sent: ${sendError.message}`)
      }
    } finally {
      if (mountedRef.current && !controller.signal.aborted) setSending(false)
    }
  }

  const newConversation = async () => {
    if (sending || loading) return
    setLoading(true)
    setError('')
    setNotice('')
    const oldId = sessionId
    const controller = new AbortController()
    requestRef.current = controller
    try {
      if (oldId) {
        try { await chatApi.deleteSession(oldId, { signal: controller.signal }) }
        catch (deleteError) {
          if (deleteError.status !== 404) throw deleteError
        }
      }
      if (oldId && sessionStorage.getItem(STORAGE_KEY) === oldId) sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(PROVIDER_KEY)
      setSessionId('')
      setMessages([])
      await startSession(controller.signal)
      setNotice('Started a new conversation.')
    } catch (resetError) {
      if (resetError.name !== 'AbortError') setError(`Could not start a new conversation. ${resetError.message}`)
    } finally {
      if (mountedRef.current && !controller.signal.aborted) setLoading(false)
    }
  }

  const showStarter = !loading && messages.length === 0
  return <section className="chat-screen" aria-labelledby="chat-title">
    <div className="chat-intro">
      <div><span className="panel-eyebrow"><Sparkles size={14} /> LOCAL COMMUTE ASSISTANT</span><h1 id="chat-title">Ask about your <span>trip through Dhaka.</span></h1><p>Search the imported transit graph, check saved route reports, or record an unverified traveller report.</p></div>
      <button className="chat-new-button" onClick={newConversation} disabled={loading || sending}><Plus size={16} /> New conversation</button>
    </div>
    <div className="chat-disclosure" role="note"><span className={`status-dot ${provider === 'gemini' ? 'green' : 'amber'}`} /><span>{provider === 'gemini' ? 'AI intent parsing enabled' : 'Local deterministic assistant'} · Answers use the local catalog. Route geometry is approximate; fares and times appear only where stored. No AI key is configured unless your local backend says otherwise.</span></div>
    <div className="chat-workspace glass-panel">
      <header className="chat-header"><span className="chat-avatar large"><Bot size={19} /></span><div><strong>Poth Mitro assistant</strong><span><i className="status-dot green" /> Local API · single-operator prototype</span></div><button className="chat-reset-icon" onClick={newConversation} disabled={loading || sending} aria-label="Start a new conversation"><RotateCcw size={16} /></button></header>
      <div className="chat-transcript" ref={scrollRef} aria-live="polite" aria-label="Conversation">
        {loading ? <div className="chat-loading" role="status"><span className="chat-spinner" /> Connecting to local assistant…</div> : null}
        {showStarter ? <div className="chat-welcome"><span className="chat-welcome-icon"><TrainFront size={22} /></span><h2>Where are you headed?</h2><p>Try a route, fare, report check, or a new traveller report. English and Banglish are supported.</p><div className="chat-suggestions">{suggestions.map(({ icon: Icon, text, label }) => <button key={label} onClick={() => { void send(text) }} disabled={!sessionId}><Icon size={15} /><span>{label}</span><ArrowUp size={13} /></button>)}</div></div> : null}
        {messages.map((message) => <MessageBubble message={message} onShowJourney={onShowJourney} key={message.id} />)}
        {sending ? <div className="chat-message assistant-message"><span className="chat-avatar"><Bot size={17} /></span><div className="chat-typing" role="status"><i /><i /><i /><span>Checking local data</span></div></div> : null}
        {error ? <div className="chat-error" role="alert">{error}{error.includes('expired') ? <button onClick={newConversation}>Start new conversation</button> : null}</div> : null}
        {notice ? <p className="chat-notice" role="status">{notice}</p> : null}
      </div>
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); void send() }}>
        <label className="sr-only" htmlFor="chat-message">Message the commute assistant</label>
        <textarea id="chat-message" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} placeholder="Ask in English or Banglish…" maxLength={4000} rows={1} disabled={!sessionId || loading || sending} />
        <button type="submit" aria-label="Send message" disabled={!draft.trim() || !sessionId || loading || sending}><ArrowUp size={18} /></button>
        <span className="chat-composer-hint"><Clock3 size={12} /> Enter to send · Shift+Enter for new line</span>
      </form>
    </div>
    <p className="chat-footnote"><ShieldCheck size={14} /> Reports submitted here are stored as <strong>reported and unverified</strong>. Route-linked reports appear with matching planner options.</p>
  </section>
}
