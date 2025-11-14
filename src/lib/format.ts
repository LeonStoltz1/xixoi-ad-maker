export const formatMoney = (v: number) =>
  Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
