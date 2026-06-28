import type { Metadata } from "next"
import Header from "./_components/header"
import { CheckoutSection } from "./_components/checkout-section"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e3mel.com"

export const metadata: Metadata = {
  title: "Invoice and Pay | Checkout & Get Paid in USDC on Stellar",
  description:
    "Create a Stellar USDC checkout invoice in seconds. Share a link, get paid. Built on Stellar with low-cost, fast cross-border payments.",
  keywords: [
    "Stellar",
    "USDC",
    "Checkout",
    "Invoice",
    "Crypto Payments",
    "Stellar USDC",
    "Get Paid in USDC",
    "Cross-Border Payments",
    "Web3 Checkout",
    "Merchant Payments",
    "Digital Currency",
  ],
  authors: [{ name: "Invoice and Pay" }],
  creator: "Invoice and Pay",
  publisher: "Invoice and Pay",
  applicationName: "Invoice and Pay",
  openGraph: {
    title: "Invoice and Pay | Checkout & Get Paid in USDC on Stellar",
    description:
      "Create a Stellar USDC checkout invoice in seconds. Share a link, get paid in USDC on Stellar.",
    url: siteUrl,
    siteName: "Invoice and Pay",
    type: "website",
    images: [
      {
        url: `${siteUrl}/images/e3mel-logo.png`,
        width: 1200,
        height: 630,
        alt: "Invoice and Pay — Checkout & Get Paid in USDC on Stellar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoice and Pay | Checkout & Get Paid in USDC on Stellar",
    description:
      "Create a Stellar USDC checkout invoice in seconds. Share a link, get paid in USDC on Stellar.",
    images: [`${siteUrl}/images/e3mel-logo.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
}

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
