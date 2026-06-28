// Local invoice history. Per-wallet, persisted to localStorage.
// Used by the History tab and the right-column "paid/unpaid" badge.

export type LocalInvoice = {
  id: string
  amount: string
  note: string
  receiver: string
  isPaid: boolean
  createdAt: number
}

const MAX_INVOICES = 50

function keyFor(address: string | null): string {
  return `stellar-invoices:${address ?? "guest"}`
}

// Tiny pub-sub so the history list can re-read when a new invoice is added,
// without prop-drilling a refresh callback. Listeners are scoped per-address.
const listeners = new Map<string, Set<() => void>>()

function notify(address: string | null) {
  const set = listeners.get(address ?? "guest")
  if (!set) return
  for (const fn of set) fn()
}

export function subscribeHistory(
  address: string | null,
  cb: () => void
): () => void {
  const k = address ?? "guest"
  let set = listeners.get(k)
  if (!set) {
    set = new Set()
    listeners.set(k, set)
  }
  set.add(cb)
  return () => {
    set!.delete(cb)
  }
}

function readRaw(address: string | null): LocalInvoice[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(keyFor(address))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isLocalInvoice)
  } catch {
    return []
  }
}

function writeRaw(address: string | null, list: LocalInvoice[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(keyFor(address), JSON.stringify(list))
  } catch {
    // localStorage quota or disabled — silently drop
  }
}

function isLocalInvoice(v: unknown): v is LocalInvoice {
  if (typeof v !== "object" || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === "string" &&
    typeof r.amount === "string" &&
    typeof r.note === "string" &&
    typeof r.receiver === "string" &&
    typeof r.isPaid === "boolean" &&
    typeof r.createdAt === "number"
  )
}

export function listInvoices(address: string | null): LocalInvoice[] {
  return readRaw(address).sort((a, b) => b.createdAt - a.createdAt)
}

export function addInvoice(
  address: string | null,
  invoice: LocalInvoice
): void {
  const list = readRaw(address)
  list.push(invoice)
  // cap
  const capped = list
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_INVOICES)
  writeRaw(address, capped)
  notify(address)
}

export function markPaidLocal(
  address: string | null,
  id: string
): LocalInvoice | null {
  const list = readRaw(address)
  const idx = list.findIndex((i) => i.id === id)
  if (idx < 0) return null
  list[idx] = { ...list[idx], isPaid: true }
  writeRaw(address, list)
  notify(address)
  return list[idx]
}
