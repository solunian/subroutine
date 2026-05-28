export const to_24hrtime_str = (t: Date) =>
  `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

export const to_date_str = (t: Date) =>
  `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`;

export const to_fulltime_str = (t: Date) => `${to_date_str(t)} ${to_24hrtime_str(t)}`;

export const get_n_days_date = (date: Date, n: number) =>
  new Date(date.getTime() + n * 24 * 60 * 60 * 1000);

export const round_to_fixed = (x: number, decimals: number) => {
  const shifts = Math.pow(10, decimals);
  const rounded = Math.round(x * shifts) / shifts;

  if (rounded === 0 && x > 0) {
    // prevent 0.00, forces to +-0.01 to show a change
    return (Math.sign(x) / shifts).toFixed(2);
  } else {
    return rounded.toFixed(decimals);
  }
};
