"use client"

// Section shell: 2-column layout. Left is the create form; right swaps
// between the help panel (idle) and the QR/share view (after a submit).

import * as React from "react"

import { Card } from "@/components/ui/card"

import { CreateCheckoutForm } from "@/app/_components/create-checkout-form"
import { HelpPanel } from "@/app/_components/help-panel"
import { InvoiceResult } from "@/app/_components/invoice-result"
import type { LocalInvoice } from "@/lib/invoices/history"

export function CheckoutSection() {
  const [lastInvoice, setLastInvoice] = React.useState<LocalInvoice | null>(
    null
  )

  const handleCreated = (invoice: LocalInvoice) => {
    setLastInvoice(invoice)
  }

  return (
    <Card className="w-full max-w-3xl rounded-2xl border-2 border-black bg-white p-0">
      <div className="grid grid-cols-1 divide-y-2 divide-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
        {/* LEFT — create form */}
        <div className="flex min-h-[420px] flex-col gap-4 p-5">
          <CreateCheckoutForm onCreated={handleCreated} />
        </div>

        {/* RIGHT — help or result */}
        <div className="flex min-h-[420px] flex-col gap-4 p-5">
          {lastInvoice ? (
            <InvoiceResult invoice={lastInvoice} />
          ) : (
            <HelpPanel />
          )}
        </div>
      </div>
    </Card>
  )
}
