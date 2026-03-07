/**
 * Maps a portfolio ticker to its Yahoo Finance symbol.
 * All Argentine assets use the .BA suffix (Buenos Aires exchange).
 * CEDEARs are quoted in ARS on Yahoo Finance as TICKER.BA.
 */
export function toYahooTicker(ticker: string): string {
  // Todos los activos argentinos (CEDEARs y acciones locales) usan sufijo .BA en Yahoo Finance
  return `${ticker}.BA`;
}
