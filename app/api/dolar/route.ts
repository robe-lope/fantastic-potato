import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/contadoconliqui', {
      next: { revalidate: 300 }, // cache 5 minutos
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as {
      compra: number;
      venta: number;
      fechaActualizacion: string;
    };

    return NextResponse.json({
      rate: data.venta,
      compra: data.compra,
      venta: data.venta,
      fechaActualizacion: data.fechaActualizacion,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Error al obtener tipo de cambio CCL: ${err}` },
      { status: 500 },
    );
  }
}
