/**
 * Maps a portfolio ticker to its Yahoo Finance symbol.
 * - ACCION_LOCAL → always .BA (e.g., GGAL → GGAL.BA)
 * - CEDEAR with ARS price → .BA (e.g., AAPL → AAPL.BA)
 * - CEDEAR with USD price → no suffix (e.g., GOOGL → GOOGL)
 */
export function toYahooTicker(
  ticker: string,
  assetType: 'CEDEAR' | 'ACCION_LOCAL',
  currency: 'ARS' | 'USD',
): string {
  if (assetType === 'ACCION_LOCAL') return `${ticker}.BA`;
  if (currency === 'ARS') return `${ticker}.BA`;
  return ticker;
}
