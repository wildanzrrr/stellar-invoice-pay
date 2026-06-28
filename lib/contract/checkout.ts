"use client"

// Wraps the generated checkout contract client.
// We instantiate it lazily and route signing through the Stellar Wallets Kit.

import { Networks } from "@creit.tech/stellar-wallets-kit"
import { Client, networks } from "@checkout/index"
import { initWalletKit, StellarWalletsKit } from "@/lib/wallet/kit"
import type { Invoice } from "@checkout/index"

const RPC_URL = "https://soroban-testnet.stellar.org"

let _client: Client | null = null

function getClient(publicKey?: string): Client {
  if (_client) return _client
  _client = new Client({
    networkPassphrase: networks.testnet.networkPassphrase,
    contractId: networks.testnet.contractId,
    rpcUrl: RPC_URL,
    publicKey,
    signTransaction: async (txXdr, opts) => {
      initWalletKit()
      return StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        ...opts,
      })
    },
  })
  return _client
}

export type CreateInvoiceResult = {
  id: string
  amount: string
  note: string
  receiver: string
  onChain: boolean
}

/**
 * Try to create the invoice on-chain. Throws if the kit/wallet flow fails.
 * Caller should catch and fall back to a local mock.
 */
export async function createInvoiceOnChain(input: {
  id: string
  receiver: string
  amount: string
  note: string
}): Promise<{ id: string }> {
  const client = getClient(input.receiver)
  const tx = await client.create_invoice({
    id: input.id,
    receiver: input.receiver,
    amount: BigInt(input.amount),
    note: input.note,
  })
  await tx.simulate()
  await tx.signAndSend()
  return { id: input.id }
}

/**
 * Read-only fetch of a single invoice. Returns null on not-found or any error.
 */
export async function fetchInvoice(id: string): Promise<Invoice | null> {
  try {
    const client = getClient()
    const tx = await client.get_invoice({ id })
    await tx.simulate()
    const result = tx.result
    if (result.isErr()) return null
    return result.unwrap()
  } catch {
    return null
  }
}
