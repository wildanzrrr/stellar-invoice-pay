"use client"

// Right-column content shown after a checkout is created.
// Slim view: just the QR + copyable pay link. Full details live in
// the History tab (click a row to open the dialog).

import { QRCodeSVG } from "qrcode.react"
import { Copy } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { payUrlFor } from "@/lib/invoices/qr-url"
import type { LocalInvoice } from "@/lib/invoices/history"

export function InvoiceResult({ invoice }: { invoice: LocalInvoice }) {
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
    <div className="flex h-full flex-col items-center gap-3 text-center">
      <div className="rounded-xl border border-border bg-white p-3">
        <QRCodeSVG value={url} size={180} level="M" />
      </div>
      <p className="text-sm text-foreground">Show this to your friend.</p>
      <div className="flex w-full flex-col gap-1.5 text-left text-xs text-muted-foreground">
        <span>Or copy this link:</span>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px]">
            {url}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={copy}
            aria-label="Copy link"
            title="Copy link"
          >
            <Copy weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  )
}
