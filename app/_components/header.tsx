"use client"

import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Link from "next/link"
import React from "react"

const Header = () => {
  return (
    <div className="flex min-h-16 w-full flex-row flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-black bg-white px-4 py-2 sm:h-20 sm:flex-nowrap sm:rounded-full sm:px-6 sm:py-2">
      <Link
        href="/"
        aria-label="Invoice and Pay — Home"
        className="text-base font-bold transition-opacity hover:opacity-70 sm:text-xl"
      >
        Invoice and Pay
      </Link>
      <ConnectWalletButton />
    </div>
  )
}

export default Header
