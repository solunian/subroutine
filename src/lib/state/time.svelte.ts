import { SvelteDate } from "svelte/reactivity";

export const time = $state({
  now: new SvelteDate(),
});

setInterval(() => {
  time.now = new SvelteDate();
}, 100);
