export function formatMoney(amountMinor: number, currency = "TRY", locale = "tr-TR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 100);
}
