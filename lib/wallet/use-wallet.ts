"use client"

import * as React from "react"
import { KitEventType, Networks } from "@creit.tech/stellar-wallets-kit"
import { initWalletKit, StellarWalletsKit } from "@/lib/wallet/kit"

type WalletState = {
  address: string | null
  network: Networks | null
  networkPassphrase: string | null
  balance: string | null // XLM balance as string
  loading: boolean
}

const initial: WalletState = {
  address: null,
  network: null,
  networkPassphrase: null,
  balance: null,
  loading: false,
}

function horizonUrlFor(passphrase: string | null): string | null {
  switch (passphrase) {
    case Networks.PUBLIC:
      return "https://horizon.stellar.org"
    case Networks.TESTNET:
      return "https://horizon-testnet.stellar.org"
    case Networks.FUTURENET:
      return "https://horizon-futurenet.stellar.org"
    default:
      return null
  }
}

async function fetchBalanceXLM(
  address: string,
  passphrase: string | null
): Promise<string | null> {
  const base = horizonUrlFor(passphrase)
  if (!base) return null
  try {
    const res = await fetch(`${base}/accounts/${address}`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      balances?: Array<{
        asset_type?: string
        asset_code?: string
        balance: string
      }>
    }
    const native = data.balances?.find((b) => b.asset_type === "native")
    return native ? native.balance : "0"
  } catch {
    return null
  }
}

function networkShortName(passphrase: string | null): string {
  switch (passphrase) {
    case Networks.PUBLIC:
      return "Public"
    case Networks.TESTNET:
      return "Testnet"
    case Networks.FUTURENET:
      return "Futurenet"
    case Networks.SANDBOX:
      return "Sandbox"
    case Networks.STANDALONE:
      return "Standalone"
    default:
      return "Unknown"
  }
}

export function useWallet() {
  const [state, setState] = React.useState<WalletState>(initial)

  // Keep last known passphrase so disconnect can keep the network label visible
  // (the kit clears state on disconnect).
  const lastPassphraseRef = React.useRef<string | null>(null)

  const refreshBalance = React.useCallback(
    async (address: string, passphrase: string | null) => {
      const bal = await fetchBalanceXLM(address, passphrase)
      setState((s) => ({ ...s, balance: bal }))
    },
    []
  )

  React.useEffect(() => {
    initWalletKit()

    const off = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (e) => {
      const { address, networkPassphrase } = e.payload
      lastPassphraseRef.current = networkPassphrase
      if (address) {
        setState((s) => ({
          ...s,
          address,
          networkPassphrase,
          network: (networkPassphrase as Networks) ?? null,
          balance: null,
          loading: false,
        }))
        void refreshBalance(address, networkPassphrase)
      } else {
        setState((s) => ({
          ...s,
          address: null,
          networkPassphrase,
          network: (networkPassphrase as Networks) ?? null,
          balance: null,
        }))
      }
    })

    return () => {
      off()
    }
  }, [refreshBalance])

  const connect = React.useCallback(async (container?: HTMLElement) => {
    initWalletKit()
    try {
      const { address } = await StellarWalletsKit.authModal({ container })
      return address
    } catch (err) {
      console.warn("Wallet connection cancelled:", err)
      return null
    }
  }, [])

  const disconnect = React.useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect()
    } catch (err) {
      console.warn("Disconnect failed:", err)
    }
    setState((s) => ({
      ...s,
      address: null,
      balance: null,
      networkPassphrase: lastPassphraseRef.current,
    }))
  }, [])

  const refresh = React.useCallback(() => {
    if (state.address) {
      void refreshBalance(state.address, state.networkPassphrase)
    }
  }, [state.address, state.networkPassphrase, refreshBalance])

  return {
    ...state,
    networkName: networkShortName(state.networkPassphrase),
    isConnected: !!state.address,
    shortAddress: state.address
      ? `${state.address.slice(0, 4)}…${state.address.slice(-4)}`
      : null,
    connect,
    disconnect,
    refresh,
  }
}
