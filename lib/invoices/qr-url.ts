// Build the shareable /pay/[id] URL for a given invoice id.
// Uses NEXT_PUBLIC_APP_URL when set, falls back to the current origin
// (browser) or a path-only string (SSR) so it's safe to call anywhere.

export function payUrlFor(id: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (base && base.length > 0) {
    return `${base.replace(/\/$/, "")}/pay/${id}`
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pay/${id}`
  }
  return `/pay/${id}`
}
