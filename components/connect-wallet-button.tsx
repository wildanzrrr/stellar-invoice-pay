/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import * as React from "react"
import { CopyIcon } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/lib/wallet/use-wallet"
import { useMediaQuery } from "@/hooks/use-media-query"
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
  const isDesktop = useMediaQuery("(min-width: 640px)")
  const [detailsOpen, setDetailsOpen] = React.useState(false)

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
    // Desktop: inline pill with all details.
    // Mobile: compact button (truncated address only) opening a Dialog
    // with the full address, network, balance and a disconnect action.
    if (isDesktop) {
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
      <>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDetailsOpen(true)}
          className={cn("font-mono", className)}
          {...props}
        >
          <span
            className="mr-2 size-2 rounded-full bg-green-500"
            aria-label="connected"
          />
          {wallet.shortAddress}
        </Button>
        <WalletDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          fullAddress={wallet.address}
          networkName={wallet.networkName}
          balance={wallet.balance}
          loading={wallet.loading}
          onDisconnect={wallet.disconnect}
        />
      </>
    )
  }

  return (
    <Button onClick={handleConnect} className={className} {...props}>
      Connect Wallet
    </Button>
  )
}

function WalletDetailsDialog({
  open,
  onOpenChange,
  fullAddress,
  networkName,
  balance,
  loading,
  onDisconnect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fullAddress: string | null
  networkName: string
  balance: string | null
  loading: boolean
  onDisconnect: () => void
}) {
  const handleDisconnect = () => {
    onDisconnect()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wallet</DialogTitle>
          <DialogDescription>
            Connected wallet details and account actions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Network</span>
            <Badge variant="secondary" className="uppercase">
              {networkName}
            </Badge>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Address</span>
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
            </div>
            <p
              className="rounded-md bg-muted/50 p-2 font-mono text-xs break-all"
              title={fullAddress ?? undefined}
            >
              {fullAddress ?? "—"}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Balance</span>
            <span className="font-mono text-sm">
              {loading
                ? "Loading…"
                : balance
                  ? `${new Intl.NumberFormat(undefined, {
                      maximumFractionDigits: 7,
                    }).format(Number(balance))} XLM`
                  : "— XLM"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
        "flex w-full flex-wrap items-center gap-2 rounded-2xl border border-border bg-input/30 px-3 py-1.5 text-sm sm:inline-flex sm:w-auto sm:flex-nowrap sm:gap-3 sm:rounded-4xl sm:px-5",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col leading-tight sm:flex-none">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span
            className="size-2 shrink-0 rounded-full bg-green-500"
            aria-label="connected"
          />
          <span className="truncate" title={fullAddress ?? undefined}>
            {address}
          </span>
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
