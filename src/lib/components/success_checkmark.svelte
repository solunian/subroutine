<script lang="ts">
  import { backOut } from "svelte/easing";
  import type { TransitionConfig } from "svelte/transition";

  const pop_and_rotate = (node: Element): TransitionConfig => {
    const transform_box = node instanceof SVGElement ? "fill-box" : "border-box";

    return {
      duration: 420,
      easing: backOut,
      css: (t, u) => `
        opacity: ${t};
        transform-box: ${transform_box};
        transform-origin: center;
        transform: rotate(${-180 * u}deg) scale(${0.15 + 0.85 * t});
      `,
    };
  };
</script>

<svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true" in:pop_and_rotate>
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.5" />
  <path
    d="m8 12 2.6 2.6L16.5 9"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="square"
    stroke-linejoin="miter" />
</svg>
