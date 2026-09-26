export function auth_redirect(value: string | null, origin: string): string {
  if (!value) return "/";

  try {
    const destination = new URL(value, origin);
    if (destination.origin === origin && !destination.pathname.startsWith("//")) {
      return destination.pathname + destination.search + destination.hash;
    }
  } catch {
    // Invalid destinations fall back to the home page.
  }

  return "/";
}
