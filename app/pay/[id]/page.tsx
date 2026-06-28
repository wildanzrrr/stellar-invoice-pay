import Header from "@/app/_components/header"
import { PayView } from "@/app/_components/pay-view"

// Pay landing for a single invoice. The full flow (loading `get_invoice`,
// reading USDC balance, calling `pay_invoice`) is in the client `PayView`
// component; this server component just unwraps the route param and
// renders the same chrome as the home page.

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start gap-6 bg-blue-50 p-5">
      <Header />
      <div className="flex w-full flex-col items-center gap-2 pt-2 text-center">
        <p className="text-sm text-muted-foreground">Build on Stellar</p>
        <h2 className="font-heading text-2xl leading-tight font-medium sm:text-3xl">
          Make Checkout,
          <br />
          get Paid in USDC
        </h2>
      </div>
      <PayView id={id} />
    </div>
  )
}
