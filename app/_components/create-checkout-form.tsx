"use client"

// Form for creating a new checkout. Uses react-hook-form + zod.
// On submit: try the on-chain create_invoice (requires a connected wallet
// on testnet). On any failure or no wallet, fall back to a local mock so
// the UI is always testable.

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { useWallet } from "@/lib/wallet/use-wallet"
import { addInvoice, type LocalInvoice } from "@/lib/invoices/history"
import { createInvoiceOnChain } from "@/lib/contract/checkout"

const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)), "Must be a number")
    .refine((v) => Number(v) > 0, "Must be greater than 0")
    .refine((v) => {
      const parts = v.split(".")
      return parts.length < 2 || parts[1].length <= 7
    }, "Max 7 decimal places"),
  note: z.string().max(200, "Max 200 characters").optional().default(""),
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export function CreateCheckoutForm({
  onCreated,
}: {
  onCreated: (invoice: LocalInvoice) => void
}) {
  const { address, isConnected } = useWallet()
  const [submitting, setSubmitting] = React.useState(false)

  const form = useForm<FormInput, unknown, FormOutput>({
    // Zod 4's root schema doesn't satisfy the v3 overload's `_def` shape,
    // so the resolver overload picker needs a tiny nudge. The cast here
    // is safe — the runtime parser and the generic params line up.
    resolver: zodResolver(formSchema as never),
    defaultValues: { amount: "", note: "" },
  })

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true)
    const id = crypto.randomUUID()
    // USDC has 7 decimals. The contract expects i128 in the smallest unit.
    const decimals = 7
    const amountStr = values.amount
    const [whole, frac = ""] = amountStr.split(".")
    const padded = (frac + "0".repeat(decimals)).slice(0, decimals)
    const onChainAmount = `${whole}${padded}`.replace(/^0+(?=\d)/, "")

    const baseInvoice: LocalInvoice = {
      id,
      amount: values.amount,
      note: values.note ?? "",
      receiver: address ?? "anonymous",
      isPaid: false,
      createdAt: new Date().getTime(),
    }

    let onChain = false
    let txHash = ""
    if (isConnected && address) {
      try {
        const result = await createInvoiceOnChain({
          id,
          receiver: address,
          amount: onChainAmount,
          note: values.note ?? "",
        })
        onChain = true
        txHash = result.txHash
        toast.success("Checkout created", {
          description: id,
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
        console.warn("create_invoice failed, using local mock:", err)
        toast.warning(
          "Created locally (no on-chain submission). Connect a funded wallet to test the real flow."
        )
      }
    } else {
      toast.warning("Connect a wallet to create on-chain checkouts")
    }

    const finalInvoice = { ...baseInvoice, id: onChain ? id : id }
    addInvoice(address, finalInvoice)
    onCreated(finalInvoice)
    form.reset()
    setSubmitting(false)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>USDC Amount</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What is this for?"
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional, max 200 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={submitting || !isConnected}>
          {submitting ? (
            <>
              <Spinner /> Creating…
            </>
          ) : !isConnected ? (
            "Connect a wallet to create"
          ) : (
            "Create Checkout"
          )}
        </Button>
        {!isConnected && (
          <p className="text-center text-xs text-muted-foreground">
            A connected testnet wallet is required to create a checkout.
          </p>
        )}
      </form>
    </Form>
  )
}
