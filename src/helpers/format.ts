const nFormat = new Intl.NumberFormat();

export function formatNumber(num: number = 0): string {
  return nFormat.format(Math.round(num));
}
