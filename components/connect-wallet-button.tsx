/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import * as React from "react"
import { CopyIcon } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet/use-wallet"
import { cn } from "@/lib/utils"

/**
 * Connect wallet button. When disconnected, opens the Stellar Wallets Kit
 * picker modal. When connected, shows the address, network, XLM balance and
 * a disconnect button.
 */
export function ConnectWalletButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const wallet = useWallet()
  const [open, setOpen] = React.useState(false)
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null
  )

  // Mount the kit container only while the modal is open so the fullscreen
  // wrapper does not intercept clicks on the rest of the page.
  React.useEffect(() => {
    if (!open) return
    const el = document.createElement("div")
    el.className =
      "fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
    document.body.appendChild(el)
    setContainerEl(el)
    return () => {
      el.remove()
      setContainerEl(null)
    }
  }, [open])

  const handleConnect = async () => {
    setOpen(true)
    // wait for the container to be in the DOM before opening the modal
    await new Promise((r) => requestAnimationFrame(r))
    const el =
      containerEl ??
      document.querySelector<HTMLDivElement>(
        ".fixed.inset-0.z-50.flex.items-center.justify-center"
      ) ??
      undefined
    await wallet.connect(el ?? undefined)
    setOpen(false)
  }

  if (wallet.isConnected) {
    return (
      <ConnectedPill
        address={wallet.shortAddress}
        fullAddress={wallet.address}
        networkName={wallet.networkName}
        balance={wallet.balance}
        loading={wallet.loading}
        onDisconnect={wallet.disconnect}
        className={className}
        {...props}
      />
    )
  }

  return (
    <Button onClick={handleConnect} className={className} {...props}>
      Connect Wallet
    </Button>
  )
}

function ConnectedPill({
  address,
  fullAddress,
  networkName,
  balance,
  loading,
  onDisconnect,
  className,
}: {
  address: string | null
  fullAddress: string | null
  networkName: string
  balance: string | null
  loading: boolean
  onDisconnect: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-4xl border border-border bg-input/30 px-5 py-1.5 text-sm",
        className
      )}
    >
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span
            className="size-2 rounded-full bg-green-500"
            aria-label="connected"
          />
          <span title={fullAddress ?? undefined}>{address}</span>
          {fullAddress ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                void navigator.clipboard
                  .writeText(fullAddress)
                  .then(() =>
                    toast.success("Address copied to clipboard", {
                      description: fullAddress,
                    })
                  )
                  .catch(() => toast.error("Failed to copy address"))
              }}
              aria-label="Copy address"
              title="Copy address"
            >
              <CopyIcon weight="bold" />
            </Button>
          ) : null}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
            {networkName}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {loading
            ? "Loading…"
            : balance
              ? `${new Intl.NumberFormat(undefined, {
                  maximumFractionDigits: 7,
                }).format(Number(balance))} XLM`
              : "— XLM"}
        </div>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="xs"
        onClick={onDisconnect}
      >
        Disconnect
      </Button>
    </div>
  )
}
