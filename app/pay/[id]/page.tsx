import Header from "@/app/_components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Minimal pay landing page. Renders the invoice ID from the route. A full
// payment flow (signing the on-chain `pay_invoice` call) lives elsewhere
// and is out of scope for this UI milestone.

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start gap-6 bg-blue-50 p-5">
      <Header />
      <div className="flex w-full max-w-md flex-col items-center gap-3 pt-4 text-center">
        <h2 className="font-heading text-2xl font-medium">Pay Invoice</h2>
        <Card className="w-full rounded-2xl border-2 border-black bg-white p-5">
          <div className="flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Invoice ID</span>
              <code className="break-all rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs">
                {id}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge variant="outline">UNPAID</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect your wallet and confirm to settle this invoice on-chain.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
