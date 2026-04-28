export const time = $state({
  now: new Date(),
});

setInterval(() => {
  time.now = new Date();
}, 100);
