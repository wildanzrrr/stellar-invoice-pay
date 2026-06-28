"use client"

// History tab content. Reads the per-wallet invoice list from localStorage
// and re-renders on create / paid events. Shows a Skeleton while loading.

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/lib/wallet/use-wallet"
import {
  listInvoices,
  subscribeHistory,
  type LocalInvoice,
} from "@/lib/invoices/history"

const XLM_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 7,
})

function shortId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}

function InvoiceRow({ invoice }: { invoice: LocalInvoice }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <span
          className="truncate font-mono text-[11px] text-muted-foreground"
          title={invoice.id}
        >
          ID: {shortId(invoice.id)}
        </span>
        <Badge
          variant={invoice.isPaid ? "default" : "outline"}
          className="shrink-0"
        >
          {invoice.isPaid ? "PAID" : "UNPAID"}
        </Badge>
      </div>
      <div className="text-foreground">
        Amount: {XLM_FORMATTER.format(Number(invoice.amount))} $USDC
      </div>
      <div className="truncate text-muted-foreground" title={invoice.note}>
        Note: {invoice.note || "—"}
      </div>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2.5"
        >
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function InvoiceHistory({ refreshKey }: { refreshKey: number }) {
  const { address } = useWallet()
  // Lazy-init from localStorage; for SSR safety, start empty and read in
  // the effect below. The address dep in the effect re-syncs on wallet change.
  const [invoices, setInvoices] = React.useState<LocalInvoice[]>([])

  // Track previous address/key so we only show the skeleton on the first
  // mount or when the wallet changes.
  const [hydrated, setHydrated] = React.useState(false)
  const [prevAddress, setPrevAddress] = React.useState(address)

  if (address !== prevAddress) {
    setPrevAddress(address)
    setInvoices(listInvoices(address))
    if (!hydrated) setHydrated(true)
  }

  React.useEffect(() => {
    // Re-read on mount and whenever the address or refreshKey changes.
    setInvoices(listInvoices(address))
    setHydrated(true)
    // Subscribe to history events (add / markPaid) for the current wallet.
    const off = subscribeHistory(address, () => {
      setInvoices(listInvoices(address))
    })
    return off
  }, [address, refreshKey])

  if (!hydrated) return <HistorySkeleton />

  if (invoices.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <p>No checkouts yet.</p>
        <p>Switch to the Create tab to make your first one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1">
      {invoices.map((inv) => (
        <InvoiceRow key={inv.id} invoice={inv} />
      ))}
    </div>
  )
}
