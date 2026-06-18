import { SvelteDate } from "svelte/reactivity";

export const now = new SvelteDate();

let now_interval: ReturnType<typeof setInterval> | undefined;

export const update_now = () => {
  now.setTime(Date.now());
};

export const start_now_interval = () => {
  update_now();
  now_interval ??= setInterval(update_now, 500);
};

export const stop_now_interval = () => {
  if (now_interval) {
    clearInterval(now_interval);
    now_interval = undefined;
  }
};
