# CLAUDE.md — Portfolio Tracker para CEDEARs y Acciones (Cocos Capital)

## Contexto del Proyecto

Soy un inversor argentino que opera desde 2023 con la app **Cocos Capital** comprando **CEDEARs** y **acciones locales**. La app no me muestra claramente cuánto llevo invertido por activo, cuánto gané o perdí en cada uno, ni mi rendimiento histórico. Solo veo el valor actual de mi cartera.

Tengo registros de todas mis compras (fecha, ticker, cantidad, precio, moneda ARS/USD) y necesito una **app web deployada** donde mi pareja y yo podamos:

1. Cargar toda mi data histórica de compras
2. Visualizar mi portfolio con métricas claras
3. Seguir agregando operaciones a medida que compre más
4. Ver gráficos de rendimiento, composición y evolución
5. Acceder desde cualquier dispositivo (PC, celular) — **cartera compartida entre los dos**

---

## Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router) — deployable en Vercel
- **Styling**: Tailwind CSS
- **Gráficos**: Recharts
- **Base de datos**: Supabase (PostgreSQL hosted, tier gratuito)
- **Lenguaje**: TypeScript
- **Deploy**: Vercel (gratuito)
- **Autenticación**: Protección simple con contraseña compartida (no necesitamos sistema de usuarios, es una cartera compartida entre dos personas)

### ¿Por qué este stack?

- **Next.js en vez de Vite**: Porque Vercel es su plataforma nativa, el deploy es automático con `git push`, y las API Routes de Next.js nos permiten poner el servidor de precios (Yahoo Finance) dentro del mismo proyecto sin necesidad de un servidor aparte.
- **Supabase en vez de localStorage**: Porque localStorage vive en el navegador de cada dispositivo. Si cargás una operación desde tu PC, tu pareja no la vería desde su celular. Con Supabase los datos están en la nube y se comparten.
- **Supabase tier gratuito**: 500MB de DB, 50,000 filas, 500,000 API requests/mes — más que suficiente para este uso.

---

## Estructura de Datos

### Operación (Transaction)

```typescript
interface Transaction {
  id: string;                    // UUID generado automáticamente
  date: string;                  // Fecha de operación (YYYY-MM-DD)
  type: 'BUY' | 'SELL';         // Tipo de operación
  ticker: string;                // Símbolo del activo (ej: "AAPL", "MELI", "GGAL")
  assetType: 'CEDEAR' | 'ACCION_LOCAL'; // Tipo de activo
  quantity: number;              // Cantidad de papeles comprados/vendidos
  totalAmount: number;           // Monto TOTAL que pagué (lo que el usuario ingresa)
  pricePerUnit: number;          // CALCULADO automáticamente: totalAmount / quantity
  currency: 'ARS' | 'USD';      // Moneda de la operación
  exchangeRate?: number;         // Tipo de cambio ARS/USD al momento (opcional, para referencia)
  notes?: string;                // Notas opcionales
}
```

> **IMPORTANTE — Flujo de carga**: El usuario ingresa **cantidad de acciones** y **monto total invertido**. El **precio por unidad se calcula automáticamente** como `totalAmount / quantity`. El usuario NO ingresa el precio por unidad manualmente. El formulario debe mostrar el precio calculado en tiempo real a medida que se completan cantidad y monto, como feedback visual (ej: "Precio por unidad: $4.500,00").

### Holding (Posición actual calculada)

```typescript
interface Holding {
  ticker: string;
  assetType: 'CEDEAR' | 'ACCION_LOCAL';
  totalQuantity: number;           // Cantidad total en cartera
  averageCostARS: number;          // Precio promedio ponderado en ARS (calculado)
  averageCostUSD: number;          // Precio promedio ponderado en USD (calculado)
  totalInvestedARS: number;        // Total invertido en ARS (plata de mi bolsillo)
  totalInvestedUSD: number;        // Total invertido en USD (plata de mi bolsillo)
  currentPricePerUnit?: number;    // Precio actual por unidad (ingresado manualmente por el usuario)
  currentPriceCurrency?: 'ARS' | 'USD'; // Moneda del precio actual
  currentTotalValue?: number;      // CALCULADO: currentPricePerUnit * totalQuantity
  unrealizedGainLoss?: number;     // CALCULADO: currentTotalValue - totalInvested (ganancia o pérdida)
  unrealizedGainLossPct?: number;  // CALCULADO: (unrealizedGainLoss / totalInvested) * 100
  transactions: Transaction[];     // Todas las operaciones de este ticker
}
```

### Precio Actual y Ganancia/Pérdida (CONCEPTO CLAVE)

Como la app es offline y no consulta APIs de precios, el usuario debe poder **ingresar manualmente el precio actual** de cada activo desde una sección dedicada (o directamente en la tabla de holdings). Con ese dato, la app calcula y muestra **por cada activo**:

| Concepto | Cálculo | Significado |
|----------|---------|-------------|
| **Capital Invertido** | Suma de `totalAmount` de todas las compras | "Plata que salió de mi bolsillo" |
| **Valor Actual** | `precioActual × cantidadTotal` | "Lo que vale hoy mi posición" |
| **Ganancia/Pérdida No Realizada** | `Valor Actual - Capital Invertido` | "Lo que la acción me generó (o me sacó) por solo tenerla" |
| **Rendimiento %** | `(Ganancia / Capital Invertido) × 100` | Porcentaje de ganancia o pérdida |

**Visualización en la tabla de Holdings**: Cada fila debe mostrar una **barra apilada o doble columna** que distinga visualmente:
- 🟦 **Azul**: Lo que invertí (mi plata)
- 🟩 **Verde**: Lo que generó la acción (ganancia no realizada, si es positiva)
- 🟥 **Rojo**: Lo que perdí (pérdida no realizada, si es negativa)

**Visualización en el Dashboard**: Agregar una card de resumen que muestre:
- **Total Capital Invertido**: Suma de todo lo que puse de mi bolsillo
- **Valor Actual del Portfolio**: Suma de todos los valores actuales (solo para activos con precio actual cargado)
- **Ganancia/Pérdida Total**: La diferencia, bien grande, en verde o rojo
- **Rendimiento Total %**: Porcentaje general

**Gráfico adicional — "Mi Plata vs Lo que Generó el Mercado"**: Un bar chart agrupado donde cada activo tenga dos barras lado a lado: una azul (capital invertido) y una verde/roja (ganancia o pérdida). Esto es el gráfico más importante de toda la app porque responde la pregunta principal del usuario.

### Precio Actual (CurrentPrice)

```typescript
interface CurrentPrice {
  ticker: string;
  price: number;               // Precio actual por unidad
  currency: 'ARS' | 'USD';    // Moneda del precio
  updatedAt: string;           // Fecha de última actualización (YYYY-MM-DD)
}
```

Los precios actuales se guardan en una tabla separada en Supabase (`current_prices`). No forman parte de las transacciones.

---

## Base de Datos — Supabase (PostgreSQL)

### Tablas

```sql
-- Tabla de operaciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('CEDEAR', 'ACCION_LOCAL')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  price_per_unit NUMERIC GENERATED ALWAYS AS (total_amount / quantity) STORED,
  currency TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  exchange_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de precios actuales
CREATE TABLE current_prices (
  ticker TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX idx_transactions_ticker ON transactions(ticker);
CREATE INDEX idx_transactions_date ON transactions(date);
```

### Configuración de Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) (tier gratuito)
2. Ejecutar el SQL de arriba en el SQL Editor de Supabase
3. En las settings del proyecto, copiar:
   - `NEXT_PUBLIC_SUPABASE_URL` (la URL del proyecto)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la anon/public key)
4. **Row Level Security (RLS)**: Como es una app privada compartida entre dos personas y no hay sistema de usuarios, **deshabilitar RLS** en ambas tablas o crear una policy que permita todo con la anon key. Esto es aceptable porque la URL de la app no es pública y la data no es sensible (son solo registros de compras). Si en el futuro se quiere agregar seguridad, se puede implementar auth.
5. Guardar las keys en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Cliente Supabase en el proyecto

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Acceso a datos (reemplaza localStorage)

Todas las operaciones CRUD que antes iban a localStorage ahora van a Supabase:

```typescript
// Ejemplo: obtener todas las transacciones
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .order('date', { ascending: false });

// Ejemplo: insertar una transacción
const { data, error } = await supabase
  .from('transactions')
  .insert({ date, type, ticker, asset_type, quantity, total_amount, currency, exchange_rate, notes })
  .select()
  .single();

// Ejemplo: actualizar precio actual
const { data, error } = await supabase
  .from('current_prices')
  .upsert({ ticker, price, currency, updated_at: new Date().toISOString() });
```

### Protección con Contraseña Compartida

Como la app no tiene sistema de usuarios pero no queremos que cualquiera con la URL pueda ver o modificar datos, implementar una **pantalla de acceso simple**:

1. Definir una variable de entorno `APP_ACCESS_PASSWORD` en Vercel (NO con prefijo `NEXT_PUBLIC_`)
2. Al entrar a la app, mostrar un input de contraseña
3. Validar la contraseña contra el servidor via una API Route de Next.js (`/api/auth`)
4. Si es correcta, guardar un token/cookie de sesión (puede ser un JWT simple o un hash) que dure 30 días
5. Si no está autenticado, redirigir siempre al login
6. **No es un auth robusto** — es simplemente una barrera para que no entre cualquier persona que encuentre la URL. Suficiente para este caso de uso.

---

## Funcionalidades Requeridas

### 1. Carga de Operaciones

- **Formulario manual — DOS MODOS de carga**:

  **Modo 1: "Tengo el monto total" (manual completo)**
  El usuario ingresa: fecha, tipo (compra/venta), ticker, tipo de activo, cantidad de acciones, monto total pagado, moneda, tipo de cambio (opcional), notas. El precio por unidad se calcula automáticamente y se muestra en tiempo real.

  **Modo 2: "Buscar precio automático" (solo cantidad + fecha)**
  El usuario ingresa: fecha, tipo, ticker, tipo de activo, **solo la cantidad de acciones** y la moneda. Al completar ticker y fecha, la app consulta la API de Yahoo Finance (`/api/prices/historical`) para obtener el **precio de cierre de esa fecha**. Con ese precio y la cantidad, se autocompleta el monto total. El usuario puede aceptar el precio sugerido o corregirlo manualmente si difiere de lo que realmente pagó.

  **Implementación del Modo 2 — API Route para precio histórico** (`app/api/prices/historical/route.ts`):
  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import yahooFinance from 'yahoo-finance2';

  export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');     // ej: "AAPL.BA"
    const date = searchParams.get('date');          // ej: "2024-03-15"

    if (!symbol || !date) {
      return NextResponse.json({ error: 'Se requiere symbol y date' }, { status: 400 });
    }

    try {
      // Buscar un rango corto alrededor de la fecha para obtener el cierre
      const targetDate = new Date(date);
      const dayBefore = new Date(targetDate);
      dayBefore.setDate(dayBefore.getDate() - 5); // 5 días atrás por si cae en fin de semana

      const result = await yahooFinance.historical(symbol, {
        period1: dayBefore.toISOString().split('T')[0],
        period2: date,
        interval: '1d',
      });

      // Tomar el cierre más cercano a la fecha pedida
      const closest = result.length > 0 ? result[result.length - 1] : null;

      if (closest) {
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
  ```

  **UX del Modo 2 en el formulario**:
  - Toggle o switch visible arriba del formulario: "Cargar monto manualmente" / "Buscar precio por fecha"
  - Cuando se activa el modo automático, el campo "Monto total" se deshabilita y muestra el valor calculado con un badge "Precio de Yahoo Finance" y la posibilidad de editarlo
  - Si la API no encuentra precio (fin de semana, feriado, ticker incorrecto), mostrar aviso y habilitar el campo para carga manual como fallback
  - Loading spinner mientras busca el precio

- **Carga masiva por CSV**: Permitir importar un archivo CSV con columnas: `fecha, tipo, ticker, tipo_activo, cantidad, monto_total, moneda, tipo_cambio, notas` (notar que es monto_total, NO precio_unitario — el precio se calcula)
- **Carga masiva por tabla editable**: Una tabla tipo spreadsheet donde pueda pegar o tipear muchas operaciones rápido. Columnas: Fecha | Tipo | Ticker | Tipo Activo | Cantidad | Monto Total | Moneda | T/C | Notas. Agregar una columna de solo lectura que muestre el precio unitario calculado
- **Validaciones**: 
  - Fecha no puede ser futura
  - Cantidad y precio deben ser positivos
  - Ticker debe ser texto alfanumérico
  - No permitir vender más de lo que se tiene en cartera

### 2. Dashboard Principal

Mostrar en la pantalla principal:

- **Resumen General**:
  - Total invertido (ARS y USD) — "plata que salió de mi bolsillo"
  - Valor actual del portfolio (solo para activos con precio actual cargado)
  - Ganancia/Pérdida total no realizada (en verde si positiva, rojo si negativa, bien grande y visible)
  - Rendimiento total % 
  - Cantidad de activos distintos en cartera
  - Cantidad total de operaciones realizadas
  - Fecha de primera y última operación

- **Tabla de Holdings**:
  - Una fila por cada ticker
  - Columnas: Ticker | Tipo (CEDEAR/Acción) | Cantidad | Precio Promedio (calculado) | Total Invertido | Precio Actual (editable inline) | Valor Actual | Ganancia/Pérdida ($) | Ganancia/Pérdida (%) | % del Portfolio
  - La columna de Ganancia/Pérdida debe tener color verde/rojo según sea positiva/negativa
  - Incluir una mini barra visual por fila mostrando proporción invertido vs ganancia
  - Si el precio actual no está cargado, mostrar "—" en las columnas de valor actual y ganancia, con un botón/ícono para cargar el precio
  - Ordenable por cualquier columna
  - Clickeable para ver detalle de operaciones de ese ticker

- **Sección "Actualizar Precios"**: Un panel rápido (puede ser un modal o sección colapsable) donde el usuario ve todos sus tickers listados con un input para cargar el precio actual de cada uno de un saque, sin tener que ir activo por activo. Incluir fecha de última actualización de precio por activo.

### 3. Gráficos

- **⭐ Mi Plata vs Lo que Generó el Mercado** (Grouped bar chart — GRÁFICO PRINCIPAL): Para cada activo, dos barras lado a lado: azul (capital invertido de mi bolsillo) y verde/roja (ganancia o pérdida no realizada). Este es el gráfico más importante de la app. Debe estar en posición prominente en el Dashboard
- **Composición del Portfolio** (Pie/Donut chart): Porcentaje que representa cada activo del total invertido
- **Composición por Tipo** (Pie/Donut chart): CEDEARs vs Acciones Locales
- **Evolución de Inversión Acumulada** (Line chart): Línea temporal mostrando cuánto fui invirtiendo mes a mes (acumulado)
- **Inversión por Mes** (Bar chart): Cuánto invertí cada mes
- **Top 5 Activos** (Horizontal bar chart): Los 5 activos en los que más invertí
- **Distribución por Moneda** (Pie chart): Cuánto operé en ARS vs USD
- **Timeline de Operaciones** (Scatter/dot chart): Cada operación como un punto en el tiempo, tamaño proporcional al monto

### 4. Vista Detalle por Activo

Al hacer click en un ticker, mostrar:

- Todas las operaciones de ese ticker en una tabla cronológica
- Precio promedio ponderado de compra
- Total invertido
- Primer y última compra
- Gráfico de precio de compra a lo largo del tiempo (line chart)
- Gráfico de cantidad acumulada (area chart)

### 5. Gestión de Datos

- **Exportar a JSON**: Botón para descargar todas las operaciones como JSON
- **Importar desde JSON**: Botón para cargar un JSON previamente exportado (para backup/restore)
- **Exportar a CSV**: Para abrir en Excel si quiero
- **Borrar operación**: Con confirmación
- **Editar operación**: Modal para modificar cualquier campo

---

## Diseño y UX

### Estilo Visual
- **Tema oscuro** como estilo principal (similar a apps financieras como TradingView)
- Paleta de colores: fondo oscuro (#0f1117), cards (#1a1d29), acentos en verde (#00c853) para positivo y rojo (#ff1744) para negativo, azul (#2979ff) para elementos neutros/primarios
- Tipografía moderna y legible (usar Google Fonts: "Inter" para texto, "JetBrains Mono" para números/montos)
- Bordes redondeados suaves, sombras sutiles
- Responsive: debe funcionar en desktop y mobile

### Layout
- **Sidebar** izquierda con navegación:
  - 📊 Dashboard
  - ➕ Nueva Operación
  - 📋 Todas las Operaciones
  - 💰 Actualizar Precios
  - 📈 Gráficos
  - ⚙️ Configuración (import/export)
- **Área principal** a la derecha con el contenido de cada sección
- En mobile: sidebar se convierte en bottom navigation

### Componentes UI
- Cards con bordes sutiles para cada métrica
- Tablas con hover highlight y zebra striping sutil
- Modales para confirmaciones y edición
- Toasts/notificaciones para acciones exitosas
- Loading states y empty states con ilustraciones simples
- Animaciones suaves en transiciones

---

## Reglas de Negocio

1. **Precio por unidad se CALCULA, no se ingresa**: El usuario carga cantidad y monto total (o usa búsqueda automática por fecha). `precioUnitario = montoTotal / cantidad`. Mostrar siempre este cálculo en la UI como feedback
2. **Precio Promedio Ponderado (PPP)**: Se calcula como `Σ(montoTotal de cada compra) / Σ(cantidad de cada compra)` para cada ticker, considerando solo las compras
3. **Las ventas reducen la cantidad** pero no afectan el PPP de lo que queda
4. **Ganancia/Pérdida No Realizada**: Se calcula como `(precioActual × cantidadActual) - totalInvertido`. Solo se muestra si el usuario cargó un precio actual para ese activo
5. **Precios actuales**: Se guardan en la tabla `current_prices` de Supabase con fecha de última actualización. El usuario los actualiza manualmente o con el botón de Yahoo Finance
6. **El portfolio muestra solo posiciones con cantidad > 0** (los activos vendidos completamente van a un historial)

### ⚠️ MONEDA DUAL — REGLA CRÍTICA

**La mayoría de las operaciones del usuario son en dólares (USD).** Toda la app debe soportar visualización completa en ambas monedas, con **USD como moneda principal de referencia** y ARS como secundaria.

**Toggle global de moneda**: En el header o navbar debe haber un switch/toggle visible que alterne entre "Ver en USD" y "Ver en ARS". Este toggle afecta TODA la app: dashboard, holdings, gráficos, detalle por activo, resúmenes. Por defecto arranca en **USD**.

**Reglas de conversión**:
- Si una operación fue registrada en USD → se muestra directo en USD, y se convierte a ARS usando el `exchange_rate` de esa operación
- Si una operación fue registrada en ARS → se muestra directo en ARS, y se convierte a USD usando el `exchange_rate` de esa operación
- Si una operación NO tiene `exchange_rate` cargado → se muestra en su moneda original y la otra columna dice "—" (no inventar tipos de cambio)

**Cálculos que DEBEN funcionar en ambas monedas**:
- Total invertido (suma de todos los montos convertidos a la moneda seleccionada)
- Precio promedio ponderado por ticker (en USD y en ARS)
- Valor actual del portfolio (usando el precio actual y la moneda del toggle)
- Ganancia/pérdida no realizada (en la moneda del toggle)
- Rendimiento % (es porcentual, no cambia con la moneda)
- Todos los gráficos deben respetar la moneda seleccionada en el toggle (ejes, tooltips, labels)

**Ejemplo concreto**: Si compré 10 AAPL por US$ 504 totales, y el toggle está en USD:
- Total invertido: US$ 504
- PPP: US$ 42/acción
- Si precio actual es US$ 48 → Valor actual: US$ 480, Ganancia: -US$ 24 (-4.76%)

Si cambio el toggle a ARS y esa operación tenía `exchange_rate: 1200`:
- Total invertido: $ 604.800
- PPP: $ 50.400/acción
- Si el precio actual en ARS del CEDEAR es $7.200 → Valor actual: $72.000, etc.

**En la tabla de Holdings**: mostrar siempre los montos en la moneda del toggle. Opcionalmente, mostrar un subtexto gris con el equivalente en la otra moneda.

**En los gráficos**: todos los ejes Y y tooltips deben usar la moneda del toggle. El prefijo del eje cambia entre "US$" y "$" según corresponda.

---

## Estructura de Archivos Sugerida

```
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout principal con sidebar
│   ├── page.tsx                  # Dashboard (página principal)
│   ├── login/
│   │   └── page.tsx              # Pantalla de contraseña
│   ├── operaciones/
│   │   ├── page.tsx              # Tabla de todas las operaciones
│   │   └── nueva/
│   │       └── page.tsx          # Formulario nueva operación
│   ├── graficos/
│   │   └── page.tsx              # Página de gráficos
│   ├── precios/
│   │   └── page.tsx              # Actualizar precios
│   ├── activo/
│   │   └── [ticker]/
│   │       └── page.tsx          # Detalle por activo (ruta dinámica)
│   ├── configuracion/
│   │   └── page.tsx              # Import/Export
│   └── api/
│       ├── auth/
│       │   └── route.ts          # Validación de contraseña
│       └── prices/
│           └── route.ts          # Proxy a Yahoo Finance (server-side)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx         # Navegación mobile
│   │   └── AuthGuard.tsx         # Wrapper que verifica autenticación
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   └── HoldingsTable.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionTable.tsx
│   │   └── BulkImport.tsx
│   ├── charts/
│   │   ├── PortfolioComposition.tsx
│   │   ├── InvestmentTimeline.tsx
│   │   ├── MonthlyInvestment.tsx
│   │   ├── TopAssets.tsx
│   │   └── InvestedVsGain.tsx    # Gráfico principal "Mi Plata vs Mercado"
│   └── ui/
│       ├── Toast.tsx
│       └── Modal.tsx
├── lib/
│   ├── supabase.ts               # Cliente Supabase
│   ├── auth.ts                   # Utilidades de autenticación
│   ├── calculations.ts           # Cálculos de PPP, ganancia, etc.
│   ├── formatters.ts             # Formateo ARS/USD/fechas
│   ├── csvParser.ts              # Parser de CSV
│   └── yahooTickers.ts           # Mapeo de tickers a Yahoo Finance
├── hooks/
│   ├── usePortfolio.ts           # Hook para holdings calculados
│   ├── useTransactions.ts        # Hook CRUD transacciones (Supabase)
│   └── usePrices.ts              # Hook CRUD precios actuales (Supabase)
├── types/
│   └── index.ts
├── .env.local                    # Variables de entorno (NO commitear)
├── .env.example                  # Template de variables
└── middleware.ts                 # Middleware Next.js para proteger rutas
```

---

## Datos de Ejemplo para Testing

Incluir al menos estas operaciones precargadas para que pueda ver la app funcionando de entrada:

```json
[
  { "date": "2023-03-15", "type": "BUY", "ticker": "AAPL", "assetType": "CEDEAR", "quantity": 10, "totalAmount": 45000, "currency": "ARS", "exchangeRate": 390, "notes": "Primera compra" },
  { "date": "2023-05-20", "type": "BUY", "ticker": "MELI", "assetType": "CEDEAR", "quantity": 5, "totalAmount": 60000, "currency": "ARS", "exchangeRate": 450 },
  { "date": "2023-07-10", "type": "BUY", "ticker": "GGAL", "assetType": "ACCION_LOCAL", "quantity": 100, "totalAmount": 180000, "currency": "ARS" },
  { "date": "2023-09-01", "type": "BUY", "ticker": "AAPL", "assetType": "CEDEAR", "quantity": 15, "totalAmount": 78000, "currency": "ARS", "exchangeRate": 680 },
  { "date": "2023-11-15", "type": "BUY", "ticker": "GOOGL", "assetType": "CEDEAR", "quantity": 8, "totalAmount": 280, "currency": "USD" },
  { "date": "2024-01-20", "type": "BUY", "ticker": "YPFD", "assetType": "ACCION_LOCAL", "quantity": 50, "totalAmount": 425000, "currency": "ARS" },
  { "date": "2024-03-10", "type": "BUY", "ticker": "MELI", "assetType": "CEDEAR", "quantity": 3, "totalAmount": 45000, "currency": "ARS", "exchangeRate": 850 },
  { "date": "2024-05-15", "type": "SELL", "ticker": "GGAL", "assetType": "ACCION_LOCAL", "quantity": 30, "totalAmount": 96000, "currency": "ARS" },
  { "date": "2024-07-01", "type": "BUY", "ticker": "TSLA", "assetType": "CEDEAR", "quantity": 20, "totalAmount": 136000, "currency": "ARS", "exchangeRate": 1200 },
  { "date": "2024-09-20", "type": "BUY", "ticker": "AAPL", "assetType": "CEDEAR", "quantity": 12, "totalAmount": 504, "currency": "USD" }
]
```

Además, incluir **precios actuales de ejemplo** para que los gráficos de ganancia/pérdida funcionen de entrada:

```json
{
  "AAPL":  { "price": 7200, "currency": "ARS", "updatedAt": "2025-03-01" },
  "MELI":  { "price": 18500, "currency": "ARS", "updatedAt": "2025-03-01" },
  "GGAL":  { "price": 5100, "currency": "ARS", "updatedAt": "2025-03-01" },
  "GOOGL": { "price": 42, "currency": "USD", "updatedAt": "2025-03-01" },
  "YPFD":  { "price": 12000, "currency": "ARS", "updatedAt": "2025-03-01" },
  "TSLA":  { "price": 8500, "currency": "ARS", "updatedAt": "2025-03-01" }
}
```

---

## Instrucciones para Claude Code

1. **Inicializar el proyecto** con `npx create-next-app@latest` (App Router, TypeScript, Tailwind CSS, ESLint)
2. **Instalar dependencias**: `@supabase/supabase-js`, `recharts`, `papaparse`, `lucide-react`, `yahoo-finance2`, `jose` (para JWT en auth), `uuid`
3. **Configurar Supabase**: crear `lib/supabase.ts` con el cliente
4. **Implementar en este orden**:
   - Tipos TypeScript
   - Cliente Supabase y hooks de datos
   - Pantalla de login con contraseña + middleware de protección de rutas
   - Layout principal (sidebar + bottom nav mobile)
   - Formulario de nueva operación
   - Tabla de operaciones
   - Dashboard con métricas calculadas
   - Gráficos
   - Vista detalle por activo
   - Import/Export (JSON y CSV)
   - Carga masiva
   - API Route `/api/prices` con Yahoo Finance
   - Botón "Buscar precios actuales"
5. **Crear un script de seed** (`scripts/seed.ts`) que inserte los datos de ejemplo en Supabase si las tablas están vacías
6. **Testear** que los cálculos de PPP y totales son correctos
7. **El resultado final debe ser una app funcional completa** que corra con `npm run dev` y se pueda deployar a Vercel con `vercel --prod` o conectando el repo de GitHub

---

## Integración de Precios Actuales — Yahoo Finance

### Concepto

Para obtener precios actuales sin necesidad de credenciales ni APIs pagas, usamos **Yahoo Finance** a través de la librería `yahoo-finance2` (Node.js). Yahoo Finance tiene todos los tickers que necesitamos:

- **CEDEARs y acciones argentinas**: usan el sufijo `.BA` (Buenos Aires). Ejemplo: `AAPL.BA`, `MELI.BA`, `GGAL.BA`, `YPFD.BA`
- **Acciones de USA** (si el usuario operó en USD directo): sin sufijo. Ejemplo: `AAPL`, `GOOGL`, `TSLA`

Al usar Next.js, la llamada a Yahoo Finance se hace server-side a través de una **API Route** (`app/api/prices/route.ts`). No necesitamos un servidor separado — va todo dentro del mismo proyecto Next.js y se deploya junto con la app en Vercel.

### Mapeo de Tickers

```typescript
// lib/yahooTickers.ts
// Reglas de mapeo:
// 1. Si el activo es ACCION_LOCAL → agregar sufijo .BA (ej: "GGAL" → "GGAL.BA")
// 2. Si el activo es CEDEAR → agregar sufijo .BA (ej: "AAPL" → "AAPL.BA" para precio en ARS)
// 3. Si el usuario quiere el precio en USD del subyacente → usar ticker sin sufijo (ej: "AAPL")

export function toYahooTicker(ticker: string, assetType: string, currency: 'ARS' | 'USD'): string {
  if (assetType === 'ACCION_LOCAL') {
    return `${ticker}.BA`;
  }
  if (currency === 'ARS') {
    return `${ticker}.BA`;
  }
  return ticker; // USD → ticker original de USA
}
```

### API Route (`app/api/prices/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function POST(request: NextRequest) {
  const { tickers } = await request.json();
  // tickers: [{ symbol: "AAPL", yahooSymbol: "AAPL.BA" }, ...]

  if (!tickers || !Array.isArray(tickers)) {
    return NextResponse.json({ error: 'Se requiere un array de tickers' }, { status: 400 });
  }

  const results = [];

  for (const { symbol, yahooSymbol } of tickers) {
    try {
      const quote = await yahooFinance.quote(yahooSymbol);
      results.push({
        ticker: symbol,
        yahooSymbol,
        price: quote.regularMarketPrice ?? null,
        currency: quote.currency ?? 'ARS',
        marketState: quote.marketState ?? 'UNKNOWN',
        name: quote.shortName ?? quote.longName ?? symbol,
        error: null,
      });
    } catch (err) {
      results.push({
        ticker: symbol,
        yahooSymbol,
        price: null,
        currency: 'ARS',
        marketState: 'UNKNOWN',
        name: symbol,
        error: `No se encontró ${yahooSymbol}`,
      });
    }
  }

  return NextResponse.json({ prices: results, fetchedAt: new Date().toISOString() });
}
```

### Integración en el Frontend

En la sección **"Actualizar Precios"** y en la **tabla de Holdings**, agregar un botón:

**🔄 "Buscar precios actuales"**

Comportamiento:
1. Al hacer click, muestra un spinner/loading con el texto "Buscando precios..."
2. Construye la lista de tickers mapeados a Yahoo Finance (aplicando las reglas de mapeo `.BA`)
3. Hace un `POST` a `/api/prices` (misma app, API Route de Next.js)
4. Al recibir la respuesta, guarda los precios en Supabase (`current_prices`) y refresca la UI
5. Muestra un toast/notificación: "✅ Precios actualizados: 5 de 6 tickers" (o errores si hubo)
6. Actualiza la fecha/hora de última actualización
7. Si el mercado está cerrado (`marketState: "CLOSED"`), mostrar un aviso sutil: "Precios al cierre del último día hábil"

---

## Deploy en Vercel

### Pasos

1. Subir el proyecto a un repo de GitHub
2. Ir a [vercel.com](https://vercel.com), conectar el repo
3. En la configuración del proyecto en Vercel, agregar las **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `APP_ACCESS_PASSWORD` (la contraseña compartida para acceder a la app)
4. Deploy automático con cada `git push`
5. Vercel asigna una URL tipo `tu-proyecto.vercel.app` — esa es la URL que compartís con tu pareja

### `.env.example` (template para desarrollo local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
APP_ACCESS_PASSWORD=tu_contraseña_compartida
```

### Ejecución local

```bash
npm install
cp .env.example .env.local  # Completar con valores reales
npm run dev
# Abrir http://localhost:3000
```

---

## Notas Importantes

- Todo debe estar **en español** (labels, placeholders, mensajes, tooltips)
- **USD es la moneda principal del usuario** — el toggle de moneda debe arrancar en USD por defecto
- Los montos en ARS deben formatearse como `$ 1.234.567,89` (punto como separador de miles, coma como decimal)
- Los montos en USD deben formatearse como `US$ 1,234.56` (coma como separador de miles, punto como decimal — formato estadounidense)
- Las fechas deben mostrarse como `DD/MM/YYYY` (formato argentino)
- Los tickers deben mostrarse siempre en MAYÚSCULAS
- **Cada métrica, tabla, gráfico y card debe funcionar correctamente tanto en USD como en ARS** — no puede haber ninguna vista que solo muestre una moneda. Esto es crítico para el usuario.
