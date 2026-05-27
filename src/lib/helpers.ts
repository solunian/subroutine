import { SvelteDate } from "svelte/reactivity";

export const to_24hrtime_str = (t: Date | SvelteDate) =>
  `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

export const to_date_str = (t: Date | SvelteDate) =>
  `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`;
