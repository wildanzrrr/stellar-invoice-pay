"use client"

// Wraps the generated payment contract client and USDC balance lookup.
// The pay flow is: read the user's USDC balance, then call
// `payment.pay_invoice(payer, invoice_contract, id)`. The payment contract
// in turn transfers USDC and cross-calls `mark_paid` on the checkout
// contract, so the client only needs to sign the outer `pay_invoice` call.

import {
  Account,
  Address,
  Networks as SdkNetworks,
  Operation,
  rpc,
  scValToNative,
  TransactionBuilder,
} from "@stellar/stellar-sdk"
import { Client, networks as paymentNetworks } from "@payment/index"
import { Networks } from "@creit.tech/stellar-wallets-kit"

import { initWalletKit, StellarWalletsKit } from "@/lib/wallet/kit"

const RPC_URL = "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = SdkNetworks.TESTNET

// USDC Stellar Asset Contract on Stellar testnet (7 decimals).
export const USDC_TOKEN_ADDRESS =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
export const USDC_DECIMALS = 7

let _client: Client | null = null

function getClient(publicKey: string): Client {
  if (_client) return _client
  _client = new Client({
    networkPassphrase: paymentNetworks.testnet.networkPassphrase,
    contractId: paymentNetworks.testnet.contractId,
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

/**
 * Read the caller's USDC balance on Stellar testnet. Returns a string in
 * human units (7 decimals) — e.g. "12.5". Returns null on any failure
 * (no account, no trustline, RPC down).
 */
export async function getUsdcBalance(address: string): Promise<string | null> {
  const server = new rpc.Server(RPC_URL, { allowHttp: false })

  let source: Account
  try {
    const remote = await server.getAccount(address)
    source = new Account(remote.accountId(), remote.sequenceNumber())
  } catch {
    // No account on testnet yet — caller needs to create + fund it first.
    return null
  }

  const op = Operation.invokeContractFunction({
    contract: USDC_TOKEN_ADDRESS,
    function: "balance",
    args: [new Address(address).toScVal()],
  })

  const tx = new TransactionBuilder(source, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build()

  try {
    const sim = await server.simulateTransaction(tx)
    if (rpc.Api.isSimulationError(sim)) return null
    const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result
      ?.retval
    if (!retval) return null
    const raw = scValToNative(retval) as bigint | number
    const big = typeof raw === "bigint" ? raw : BigInt(raw)
    return formatUsdc(big, USDC_DECIMALS)
  } catch {
    return null
  }
}

/**
 * Pay an open invoice on the checkout contract via the payment contract.
 * Returns the tx hash of the outer pay_invoice call.
 */
export async function payInvoiceOnChain(input: {
  payer: string
  invoiceContract: string
  invoiceId: string
}): Promise<{ txHash: string }> {
  const client = getClient(input.payer)
  const tx = await client.pay_invoice({
    payer: input.payer,
    invoice_contract: input.invoiceContract,
    id: input.invoiceId,
  })
  await tx.simulate()
  const sent = await tx.signAndSend()
  const txHash =
    sent.getTransactionResponse?.txHash ??
    sent.sendTransactionResponse?.hash ??
    ""
  return { txHash }
}

// ---------- internal helpers ----------

function formatUsdc(raw: bigint, decimals: number): string {
  const s = raw.toString().padStart(decimals + 1, "0")
  const whole = s.slice(0, s.length - decimals) || "0"
  const frac = s.slice(s.length - decimals).replace(/0+$/, "")
  return frac ? `${whole}.${frac}` : whole
}
