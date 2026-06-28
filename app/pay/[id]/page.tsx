import type { Metadata } from "next"
import Header from "@/app/_components/header"
import { PayView } from "@/app/_components/pay-view"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e3mel.com"

// Pay landing for a single invoice. The full flow (loading `get_invoice`,
// reading USDC balance, calling `pay_invoice`) is in the client `PayView`
// component; this server component just unwraps the route param and
// renders the same chrome as the home page.

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const shortId = id.length > 8 ? `${id.slice(0, 8)}…` : id
  const pageUrl = `${siteUrl}/pay/${id}`

  return {
    title: `Pay Invoice ${shortId} | Invoice and Pay`,
    description:
      "Complete a USDC payment on Stellar for this invoice. Fast, low-cost, and secure checkout.",
    authors: [{ name: "Invoice and Pay" }],
    creator: "Invoice and Pay",
    publisher: "Invoice and Pay",
    applicationName: "Invoice and Pay",
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `Pay Invoice ${shortId} | Invoice and Pay`,
      description:
        "Complete a USDC payment on Stellar for this invoice. Fast, low-cost, and secure checkout.",
      url: pageUrl,
      siteName: "Invoice and Pay",
      type: "website",
      images: [
        {
          url: `${siteUrl}/images/e3mel-logo.png`,
          width: 1200,
          height: 630,
          alt: "Invoice and Pay — Pay Invoice in USDC on Stellar",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Pay Invoice ${shortId} | Invoice and Pay`,
      description:
        "Complete a USDC payment on Stellar for this invoice. Fast, low-cost, and secure checkout.",
      images: [`${siteUrl}/images/e3mel-logo.png`],
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}

export default async function PayPage({ params }: Props) {
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
