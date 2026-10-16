const DB_NAME = 'dhakapath-local-cache'
const STORE = 'trip-contexts'
export const CACHE_SCHEMA_VERSION = 1
export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function openCache() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDB is unavailable'))
    const request = indexedDB.open(DB_NAME, CACHE_SCHEMA_VERSION)
    let blocked = false
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' })
    }
    request.onsuccess = () => {
      if (blocked) return request.result.close()
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error || new Error('Could not open local cache'))
    request.onblocked = () => { blocked = true; reject(new Error('Local cache upgrade is blocked by another tab')) }
  })
}

async function transact(mode, operation) {
  const db = await openCache()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const store = tx.objectStore(STORE)
      const result = operation(store)
      tx.oncomplete = () => resolve(result?.result)
      tx.onerror = () => reject(tx.error || new Error('Local cache operation failed'))
      tx.onabort = () => reject(tx.error || new Error('Local cache operation was aborted'))
    })
  } finally {
    db.close()
  }
}

export function cacheKey(scope, tripId) {
  return `${scope}:${tripId}`
}

export async function saveTripContext(scope, tripId, context) {
  const cachedAt = new Date().toISOString()
  const record = {
    key: cacheKey(scope, tripId), schema_version: CACHE_SCHEMA_VERSION,
    scope, trip_id: tripId, context, cached_at: cachedAt,
    reports_loaded_count: context.reports?.length || 0,
    reports_complete: context.reports_next_cursor == null,
    reports_next_cursor: context.reports_next_cursor || null,
  }
  await transact('readwrite', (store) => store.put(record))
  return record
}

export async function readTripContext(scope, tripId) {
  const record = await transact('readonly', (store) => store.get(cacheKey(scope, tripId)))
  if (!record || record.schema_version !== CACHE_SCHEMA_VERSION || record.scope !== scope || record.trip_id !== tripId) return null
  const age = Date.now() - Date.parse(record.cached_at)
  if (!Number.isFinite(age) || age < 0 || age > CACHE_MAX_AGE_MS) {
    await deleteTripContext(scope, tripId).catch(() => {})
    return null
  }
  if (!record.context || record.context.trip?.id !== tripId || !Array.isArray(record.context.reports)) return null
  return record
}

export async function deleteTripContext(scope, tripId) {
  return transact('readwrite', (store) => store.delete(cacheKey(scope, tripId)))
}

export async function clearTripContexts(scope) {
  const db = await openCache()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const cursor = tx.objectStore(STORE).openCursor()
      cursor.onsuccess = () => {
        const item = cursor.result
        if (!item) return
        if (item.value.scope === scope) item.delete()
        item.continue()
      }
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error || new Error('Could not clear local cache'))
    })
  } finally { db.close() }
}
