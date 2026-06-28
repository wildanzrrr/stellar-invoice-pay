// Build the shareable /pay/[id] URL for a given invoice id.
// SSR-safe: returns a path-only fallback when window is unavailable.

export function payUrlFor(id: string): string {
  if (typeof window === "undefined") return `/pay/${id}`
  return `${window.location.origin}/pay/${id}`
}
