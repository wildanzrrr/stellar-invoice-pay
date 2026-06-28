"use client"

// Section shell: 2-column layout with a Tabs panel on the left and a
// right column that swaps between the help panel (idle) and the QR/share
// view (after a successful submit).

import * as React from "react"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CreateCheckoutForm } from "@/app/_components/create-checkout-form"
import { HelpPanel } from "@/app/_components/help-panel"
import { InvoiceHistory } from "@/app/_components/invoice-history"
import { InvoiceResult } from "@/app/_components/invoice-result"
import type { LocalInvoice } from "@/lib/invoices/history"

export function CheckoutSection() {
  const [lastInvoice, setLastInvoice] = React.useState<LocalInvoice | null>(
    null
  )
  // Bump this when a new invoice is created so the History tab re-reads.
  const [historyKey, setHistoryKey] = React.useState(0)

  const handleCreated = (invoice: LocalInvoice) => {
    setLastInvoice(invoice)
    setHistoryKey((k) => k + 1)
  }

  return (
    <Card className="w-full max-w-3xl rounded-2xl border-2 border-black bg-white p-0">
      <div className="grid grid-cols-1 divide-y-2 divide-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
        {/* LEFT — tabs */}
        <div className="flex min-h-[420px] flex-col gap-4 p-5">
          <Tabs defaultValue="create" className="flex h-full flex-col gap-4">
            <TabsList>
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="flex-1 outline-none">
              <CreateCheckoutForm onCreated={handleCreated} />
            </TabsContent>
            <TabsContent value="history" className="flex-1 outline-none">
              <InvoiceHistory refreshKey={historyKey} />
            </TabsContent>
          </Tabs>
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
