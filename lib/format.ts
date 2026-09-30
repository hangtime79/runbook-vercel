/** 0.0947 -> "9.47%". */
export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

/** 24080 -> "24,080". */
export const int = (v: number) => Math.round(v).toLocaleString("en-US");

const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const usd = (v: number) => usdFmt.format(v);
