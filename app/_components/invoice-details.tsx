"use client"

// Shared invoice detail block: QR code + copyable URL + details list.
// Used in the dialog and in the right column of the checkout section.

import { QRCodeSVG } from "qrcode.react"
import { Copy } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { payUrlFor } from "@/lib/invoices/qr-url"
import type { LocalInvoice } from "@/lib/invoices/history"

const FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 7,
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString()
}

export function InvoiceDetails({ invoice }: { invoice: LocalInvoice }) {
  const url = payUrlFor(invoice.id)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard", { description: url })
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col items-center gap-2">
        <div className="rounded-xl border border-border bg-white p-3">
          {/* QR scales down on narrow viewports via CSS; the size prop
              is the rendered SVG pixel size before scaling. */}
          <QRCodeSVG
            value={url}
            size={180}
            level="M"
            className="h-auto w-40 max-w-full sm:w-48"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Scan to pay this checkout
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-2 text-xs">
        <Row label="ID" value={invoice.id} mono />
        <Row
          label="Amount"
          value={`${FORMATTER.format(Number(invoice.amount))} $USDC`}
        />
        <Row
          label="Status"
          value={
            <Badge variant={invoice.isPaid ? "default" : "outline"}>
              {invoice.isPaid ? "PAID" : "UNPAID"}
            </Badge>
          }
        />
        <Row label="Receiver" value={invoice.receiver} mono />
        <Row label="Note" value={invoice.note || "—"} />
        <Row label="Created" value={formatDate(invoice.createdAt)} />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Pay URL</span>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <code className="block w-full min-w-0 truncate rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px]">
            {url}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="shrink-0 sm:size-8 sm:p-0"
            aria-label="Copy link"
            title="Copy link"
          >
            <Copy weight="bold" />
            <span className="ml-1.5 sm:hidden">Copy</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  const raw = typeof value === "string" ? value : undefined
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="shrink-0 pt-0.5 text-muted-foreground">{label}</span>
      <span
        className={
          "min-w-0 flex-1 text-right" +
          (mono ? " truncate font-mono text-[11px]" : " break-words")
        }
        title={raw}
      >
        {value}
      </span>
    </div>
  )
}
