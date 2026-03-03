import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart,
  BarChart, Bar, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import type { Transaction } from '../../types';
import { usePortfolio } from '../../hooks/usePortfolio';
import { formatARS, formatUSD } from '../../utils/formatters';

const COLORS = [
  '#2979ff', '#00c853', '#ff6d00', '#aa00ff', '#00b8d4',
  '#ffd600', '#ff1744', '#00bfa5', '#f50057', '#64dd17',
];

interface ChartsPageProps {
  transactions: Transaction[];
}

const tooltipStyle = {
  backgroundColor: '#1a1d29',
  border: '1px solid #2d3348',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1d29] border border-[#2d3348] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

export function ChartsPage({ transactions }: ChartsPageProps) {
  const { holdings } = usePortfolio(transactions);

  // Composición por activo
  const compositionData = useMemo(() =>
    holdings
      .filter(h => h.totalInvestedARS > 0)
      .sort((a, b) => b.totalInvestedARS - a.totalInvestedARS)
      .map(h => ({
        name: h.ticker,
        value: Math.round(h.totalInvestedARS),
      })),
    [holdings]
  );

  // Composición por tipo
  const typeData = useMemo(() => {
    const cedears = holdings.filter(h => h.assetType === 'CEDEAR').reduce((s, h) => s + h.totalInvestedARS, 0);
    const local = holdings.filter(h => h.assetType === 'ACCION_LOCAL').reduce((s, h) => s + h.totalInvestedARS, 0);
    return [
      { name: 'CEDEARs', value: Math.round(cedears) },
      { name: 'Acciones Locales', value: Math.round(local) },
    ].filter(d => d.value > 0);
  }, [holdings]);

  // Evolución acumulada por mes
  const evolutionData = useMemo(() => {
    const buys = transactions.filter(t => t.type === 'BUY').sort((a, b) => a.date.localeCompare(b.date));
    const monthly: Record<string, number> = {};

    for (const tx of buys) {
      const month = tx.date.slice(0, 7);
      const amountARS = tx.currency === 'ARS'
        ? tx.totalAmount
        : tx.exchangeRate ? tx.totalAmount * tx.exchangeRate : 0;
      monthly[month] = (monthly[month] || 0) + amountARS;
    }

    const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    return sorted.map(([month, amount]) => {
      cumulative += amount;
      const [year, m] = month.split('-');
      return {
        month: `${m}/${year.slice(2)}`,
        mensual: Math.round(amount),
        acumulado: Math.round(cumulative),
      };
    });
  }, [transactions]);

  // Inversión por mes (bar chart)
  const monthlyData = evolutionData.map(d => ({ month: d.month, invertido: d.mensual }));

  // Top 5 activos
  const top5Data = useMemo(() =>
    [...holdings]
      .sort((a, b) => b.totalInvestedARS - a.totalInvestedARS)
      .slice(0, 5)
      .map(h => ({
        ticker: h.ticker,
        invertido: Math.round(h.totalInvestedARS),
      })),
    [holdings]
  );

  // Distribución por moneda
  const currencyData = useMemo(() => {
    const arsTotal = transactions.filter(t => t.type === 'BUY' && t.currency === 'ARS').reduce((s, t) => s + t.totalAmount, 0);
    const usdTotal = transactions.filter(t => t.type === 'BUY' && t.currency === 'USD').reduce((s, t) => s + t.totalAmount, 0);
    return [
      { name: 'ARS (Pesos)', value: Math.round(arsTotal) },
      { name: 'USD (Dólares)', value: Math.round(usdTotal) },
    ].filter(d => d.value > 0);
  }, [transactions]);

  // Timeline de operaciones
  const timelineData = useMemo(() =>
    transactions
      .filter(t => t.type === 'BUY')
      .map(t => {
        const amountARS = t.currency === 'ARS' ? t.totalAmount : (t.exchangeRate ? t.totalAmount * t.exchangeRate : t.totalAmount * 1000);
        return {
          date: new Date(t.date).getTime(),
          amount: Math.round(amountARS),
          ticker: t.ticker,
          type: t.type,
        };
      }),
    [transactions]
  );

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {
    cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number; name?: string;
  }) => {
    if ((percent ?? 0) < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = (innerRadius ?? 0) + ((outerRadius ?? 0) - (innerRadius ?? 0)) * 0.5;
    const x = (cx ?? 0) + r * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = (cy ?? 0) + r * Math.sin(-(midAngle ?? 0) * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
        {name}
      </text>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">📈</p>
        <p className="text-slate-400">No hay datos para mostrar gráficos</p>
        <p className="text-slate-600 text-sm mt-1">Agregá operaciones para ver visualizaciones</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Composición del portfolio */}
      {compositionData.length > 0 && (
        <ChartCard title="Composición del Portfolio">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={compositionData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={50}
                dataKey="value"
                labelLine={false}
                label={renderLabel}
              >
                {compositionData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined) => [formatARS(val ?? 0), 'Invertido']}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Composición por tipo */}
      {typeData.length > 0 && (
        <ChartCard title="CEDEARs vs Acciones Locales">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={50}
                dataKey="value"
              >
                <Cell fill="#2979ff" />
                <Cell fill="#ff6d00" />
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined) => [formatARS(val ?? 0), 'Invertido']}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Evolución acumulada */}
      {evolutionData.length > 0 && (
        <ChartCard title="Evolución de Inversión Acumulada">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorAcum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2979ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2979ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined) => [formatARS(val ?? 0), 'Acumulado']}
              />
              <Area type="monotone" dataKey="acumulado" stroke="#2979ff" fill="url(#colorAcum)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Inversión mensual */}
      {monthlyData.length > 0 && (
        <ChartCard title="Inversión por Mes">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined) => [formatARS(val ?? 0), 'Invertido']}
              />
              <Bar dataKey="invertido" fill="#00c853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Top 5 activos */}
      {top5Data.length > 0 && (
        <ChartCard title="Top 5 Activos">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5Data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="ticker" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined) => [formatARS(val ?? 0), 'Invertido']}
              />
              <Bar dataKey="invertido" radius={[0, 4, 4, 0]}>
                {top5Data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Distribución por moneda */}
      {currencyData.length > 0 && (
        <ChartCard title="Distribución por Moneda">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={currencyData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                labelLine={true}
              >
                <Cell fill="#00c853" />
                <Cell fill="#2979ff" />
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined, name: string | undefined) => {
                  const isUSD = name === 'USD (Dólares)';
                  return [isUSD ? formatUSD(val ?? 0) : formatARS(val ?? 0), name ?? ''];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Timeline de operaciones */}
      {timelineData.length > 0 && (
        <ChartCard title="Timeline de Compras">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
              <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
                }}
              />
              <YAxis
                dataKey="amount"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <ZAxis dataKey="amount" range={[40, 400]} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3', stroke: '#2d3348' }}
                formatter={(val: number | undefined, name: string | undefined) => {
                  const v = val ?? 0;
                  if (name === 'amount') return [formatARS(v), 'Monto'];
                  if (name === 'date') return [new Date(v).toLocaleDateString('es-AR'), 'Fecha'];
                  return [v, name ?? ''];
                }}
              />
              <Scatter data={timelineData} fill="#2979ff" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Línea de evolución mensual + acumulado combinado */}
      {evolutionData.length > 1 && (
        <ChartCard title="Inversión Mensual vs Acumulado">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number | undefined, name: string | undefined) => [
                  formatARS(val ?? 0),
                  name === 'mensual' ? 'Mes' : 'Acumulado',
                ]}
              />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                {v === 'mensual' ? 'Inversión del mes' : 'Acumulado'}
              </span>} />
              <Line type="monotone" dataKey="mensual" stroke="#00c853" strokeWidth={2} dot={{ r: 3, fill: '#00c853' }} />
              <Line type="monotone" dataKey="acumulado" stroke="#2979ff" strokeWidth={2} dot={{ r: 3, fill: '#2979ff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
