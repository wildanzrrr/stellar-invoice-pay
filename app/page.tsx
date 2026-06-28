import Header from "./_components/header"
import { CheckoutSection } from "./_components/checkout-section"

export default function Page() {
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
      <CheckoutSection />
    </div>
  )
}
