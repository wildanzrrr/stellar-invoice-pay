"use client"

// History tab content. Reads the per-wallet invoice list from localStorage
// and re-renders on create / paid events. Shows a Skeleton while loading.
// Each row is clickable and opens a dialog with the full invoice details.

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWallet } from "@/lib/wallet/use-wallet"
import {
  listInvoices,
  subscribeHistory,
  type LocalInvoice,
} from "@/lib/invoices/history"
import { InvoiceDetails } from "@/app/_components/invoice-details"

const XLM_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 7,
})

function shortId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}

function InvoiceRow({
  invoice,
  onClick,
}: {
  invoice: LocalInvoice
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border bg-card p-2.5 text-left text-xs transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
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
    </button>
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
  const [active, setActive] = React.useState<LocalInvoice | null>(null)
  const [invoices, setInvoices] = React.useState<LocalInvoice[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  // Hydrate on mount + re-read whenever the wallet address or the
  // parent's refreshKey changes. The subscribe effect below is the
  // path for notifications from addInvoice / markPaidLocal.
  React.useEffect(() => {
    setHydrated(true)
    setInvoices(listInvoices(address))
  }, [address, refreshKey])

  React.useEffect(() => {
    const off = subscribeHistory(address, () => {
      setInvoices(listInvoices(address))
    })
    return off
  }, [address])

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
    <>
      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
        {invoices.map((inv) => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            onClick={() => setActive(inv)}
          />
        ))}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Checkout Details</DialogTitle>
            <DialogDescription>
              Scan the QR or share the link to receive payment in USDC.
            </DialogDescription>
          </DialogHeader>
          {active && <InvoiceDetails invoice={active} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
