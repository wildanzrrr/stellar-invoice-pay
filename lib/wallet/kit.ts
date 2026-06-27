"use client"

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk"
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils"
import {
  WalletConnectModule,
  WalletConnectTargetChain,
} from "@creit.tech/stellar-wallets-kit/modules/wallet-connect"
import { Networks } from "@stellar/stellar-sdk"

let initialized = false

/**
 * Initialize the kit once on the client.
 * Safe to call repeatedly; subsequent calls are no-ops.
 */
export function initWalletKit() {
  if (initialized || typeof window === "undefined") return

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""

  StellarWalletsKit.init({
    modules: [
      ...defaultModules(),
      ...(projectId
        ? [
            new WalletConnectModule({
              projectId,
              allowedChains: [WalletConnectTargetChain.TESTNET],
              metadata: {
                name: "Stellar Invoice Pay",
                description: "Stellar invoice payment app",
                url:
                  typeof window !== "undefined" ? window.location.origin : "",
                icons: [],
              },
            }),
          ]
        : []),
    ],
  })

  if (process.env.NEXT_PUBLIC_STELLAR_NETWORK === "TESTNET") {
    StellarWalletsKit.setNetwork(Networks.TESTNET)
  } else if (process.env.NEXT_PUBLIC_STELLAR_NETWORK === "FUTURENET") {
    StellarWalletsKit.setNetwork(Networks.FUTURENET)
  } else {
    StellarWalletsKit.setNetwork(Networks.PUBLIC)
  }

  initialized = true
}

export { StellarWalletsKit }
