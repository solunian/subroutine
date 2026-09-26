<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="flex w-full items-center gap-3 py-1 text-neutral-500/80" aria-hidden="true">
  <span class="h-px flex-1 bg-neutral-500/30"></span>
  <span>or</span>
  <span class="h-px flex-1 bg-neutral-500/30"></span>
</div>

<form method="POST" action="/auth/google" class="w-full">
  <input type="hidden" name="redirect" value={page.url.searchParams.get("redirect") ?? "/"} />
  <button
    type="submit"
    class="flex w-full items-center justify-center gap-2 border border-neutral-500/50 bg-black/0 px-4 py-1 text-center transition-colors duration-200 ease-in-out hover:bg-black/10 motion-reduce:transition-none dark:bg-white/0 dark:hover:bg-white/10">
    <svg class="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A10 10 0 0 0 12 22Z" />
      <path
        fill="#FBBC05"
        d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z" />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z" />
    </svg>
    continue with google
  </button>
</form>
