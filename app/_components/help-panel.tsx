"use client"

// Default right-column content: a numbered walkthrough shown when no
// checkout has been created yet in this session.

const STEPS = [
  "Make your checkout, specify the USDC amount and a notes.",
  "Create the checkout.",
  "Share with your client.",
  "Get paid in USDC.",
  "Done.",
]

export function HelpPanel() {
  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-sm font-medium text-foreground">Just easy step:</p>
      <ol className="flex flex-col gap-1.5 text-sm text-foreground/80">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 font-mono">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
