import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

yahooFinance.suppressNotices(['ripHistorical']);
yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const date = searchParams.get('date');

  if (!symbol || !date) {
    return NextResponse.json({ error: 'Se requiere symbol y date' }, { status: 400 });
  }

  try {
    const targetDate = new Date(date);
    const period1 = new Date(targetDate);
    period1.setDate(period1.getDate() - 7); // 7 days back for weekends/holidays

    const result = await yahooFinance.chart(symbol, {
      period1: period1.toISOString().split('T')[0],
      period2: date,
      interval: '1d',
    }, { validateResult: false });

    const quotes = result.quotes ?? [];
    const closest = quotes.length > 0 ? quotes[quotes.length - 1] : null;

    if (closest?.close != null) {
      return NextResponse.json({
        price: closest.close,
        date: closest.date,
        currency: symbol.endsWith('.BA') ? 'ARS' : 'USD',
      });
    }

    return NextResponse.json({ error: 'No se encontró precio para esa fecha' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: `Error buscando precio: ${err}` }, { status: 500 });
  }
}
