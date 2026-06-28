"use client"

// Pay flow for a single invoice. Loads `get_invoice` from the checkout
// contract, reads the caller's USDC balance from the SAC, then calls
// `payment.pay_invoice` (which transfers USDC and cross-calls
// `mark_paid` on the checkout contract). Triggers a confetti burst on
// success.

import * as React from "react"
import { toast } from "sonner"
import { ArrowUpRight } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

import { useWallet } from "@/lib/wallet/use-wallet"
import { fetchInvoice } from "@/lib/contract/checkout"
import {
  getUsdcBalance,
  payInvoiceOnChain,
  USDC_DECIMALS,
} from "@/lib/contract/payment"
import { networks as checkoutNetworks } from "@checkout/index"
import { Confetti } from "@/app/_components/confetti"

const USDC_FAUCET_URL = "https://faucet.circle.com/"

const FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: USDC_DECIMALS,
})

type ViewState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready" }
  | { kind: "paid" }
  | { kind: "error"; message: string }

function formatUsdc(raw: bigint): string {
  const s = raw.toString().padStart(USDC_DECIMALS + 1, "0")
  const whole = s.slice(0, s.length - USDC_DECIMALS) || "0"
  const frac = s.slice(s.length - USDC_DECIMALS).replace(/0+$/, "")
  return frac ? `${whole}.${frac}` : whole
}

function invoiceAmountToBigint(amount: bigint | number | string): bigint {
  if (typeof amount === "bigint") return amount
  return BigInt(amount)
}

function amountToDisplay(raw: bigint): string {
  return `${FORMATTER.format(Number(formatUsdc(raw)))} $USDC`
}

export function PayView({ id }: { id: string }) {
  const { address, isConnected } = useWallet()

  const [view, setView] = React.useState<ViewState>({ kind: "loading" })
  const [amount, setAmount] = React.useState<bigint | null>(null)
  const [receiver, setReceiver] = React.useState<string>("")
  const [note, setNote] = React.useState<string>("")

  const [balance, setBalance] = React.useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = React.useState(false)
  const [paying, setPaying] = React.useState(false)
  const [showConfetti, setShowConfetti] = React.useState(false)
  const [lastTxHash, setLastTxHash] = React.useState<string>("")

  // 1. Load the invoice once on mount.
  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      setView({ kind: "loading" })
      const inv = await fetchInvoice(id)
      if (cancelled) return
      if (!inv) {
        setView({
          kind: "error",
          message: "Invoice not found on-chain.",
        })
        return
      }
      setAmount(invoiceAmountToBigint(inv.amount))
      setReceiver(inv.receiver)
      setNote(inv.note ?? "")
      if (inv.is_paid) {
        setView({ kind: "paid" })
      } else {
        setView({ kind: "ready" })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  // 2. Refresh USDC balance whenever the wallet changes or the view
  //    re-enters the ready state (e.g. after a failed pay attempt).
  React.useEffect(() => {
    if (!isConnected || !address) {
      // Defer the reset so it doesn't count as a sync setState-in-effect.
      const t = setTimeout(() => setBalance(null), 0)
      return () => clearTimeout(t)
    }
    if (view.kind !== "ready") return
    let cancelled = false
    void (async () => {
      setBalanceLoading(true)
      const bal = await getUsdcBalance(address)
      if (cancelled) return
      setBalance(bal)
      setBalanceLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [address, isConnected, view.kind])

  const balanceBigint = React.useMemo(() => {
    if (balance == null) return null
    const [w, f = ""] = balance.split(".")
    const padded = (f + "0".repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS)
    try {
      return BigInt(`${w}${padded}`)
    } catch {
      return null
    }
  }, [balance])

  const insufficient =
    amount != null && balanceBigint != null && balanceBigint < amount
  const canPay =
    isConnected &&
    view.kind === "ready" &&
    amount != null &&
    balanceBigint != null &&
    !insufficient

  const reason = !isConnected
    ? "Connect your wallet to pay"
    : view.kind === "ready" && balanceBigint == null
      ? balanceLoading
        ? "Checking USDC balance…"
        : "No USDC balance found"
      : insufficient
        ? "Insufficient USDC balance"
        : !canPay && view.kind === "ready"
          ? "Add USDC to continue"
          : null

  const onPay = async () => {
    if (!canPay || !address || amount == null) return
    setPaying(true)
    try {
      const { txHash } = await payInvoiceOnChain({
        payer: address,
        invoiceContract: checkoutNetworks.testnet.contractId,
        invoiceId: id,
      })
      setLastTxHash(txHash)
      setView({ kind: "paid" })
      setShowConfetti(true)
      toast.success("Payment confirmed", {
        description: "Invoice settled on-chain.",
        action: txHash
          ? {
              label: "View on explorer",
              onClick: () =>
                window.open(
                  `https://stellar.expert/explorer/testnet/tx/${txHash}`,
                  "_blank",
                  "noopener,noreferrer"
                ),
            }
          : undefined,
      })
    } catch (err) {
      console.error("pay_invoice failed:", err)
      toast.error("Payment failed", {
        description:
          err instanceof Error ? err.message : "Unknown on-chain error",
      })
    } finally {
      setPaying(false)
    }
  }

  return (
    <>
      <Card className="flex w-full max-w-md flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Details</h3>
          {view.kind === "paid" ? (
            <Badge variant="default">PAID</Badge>
          ) : view.kind === "ready" ? (
            <Badge variant="outline">UNPAID</Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <Row label="ID" value={id} mono />
          <Row
            label="Receiver"
            value={receiver || "—"}
            mono
            loading={view.kind === "loading"}
          />
          <Row
            label="Amount"
            value={amount != null ? amountToDisplay(amount) : "—"}
            loading={view.kind === "loading"}
          />
          <Row
            label="Notes"
            value={note || "—"}
            loading={view.kind === "loading"}
          />
        </div>

        {view.kind === "paid" ? (
          <div className="flex flex-col gap-2">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              This invoice has been paid. Thank you.
            </div>
            {lastTxHash && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://stellar.expert/explorer/testnet/tx/${lastTxHash}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                View transaction
                <ArrowUpRight weight="bold" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              className="bg-black text-white hover:bg-black/90"
              disabled={!canPay || paying}
              onClick={onPay}
            >
              {paying ? (
                <>
                  <Spinner /> Paying…
                </>
              ) : (
                "Pay Checkout"
              )}
            </Button>

            <div className="flex min-w-0 flex-col gap-1 text-center">
              <p className="text-xs text-muted-foreground">
                {balanceLoading
                  ? "Checking USDC balance…"
                  : balance != null
                    ? `Your Balance: ${balance} $USDC`
                    : isConnected
                      ? "No USDC balance found"
                      : "Connect wallet to see your balance"}
              </p>
              {reason && canPay === false && paying === false && (
                <p className="text-[11px] text-muted-foreground">{reason}</p>
              )}
              <a
                href={USDC_FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-foreground underline-offset-2 hover:underline"
              >
                Don&apos;t have $USDC? Get faucet here.
                <ArrowUpRight weight="bold" className="size-3" />
              </a>
            </div>
          </>
        )}

        {view.kind === "loading" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner /> Loading invoice…
          </div>
        )}
        {view.kind === "error" && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {view.message}
          </div>
        )}
      </Card>

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </>
  )
}

function Row({
  label,
  value,
  mono,
  loading,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  loading?: boolean
}) {
  const raw = typeof value === "string" ? value : undefined
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="shrink-0 pt-0.5 text-muted-foreground">{label}</span>
      <span
        className={
          "min-w-0 flex-1 text-right" +
          (mono ? " truncate font-mono text-[11px]" : " break-words")
        }
        title={raw}
      >
        {loading ? <span className="text-muted-foreground">…</span> : value}
      </span>
    </div>
  )
}
