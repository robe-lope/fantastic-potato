'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useCurrency } from '@/contexts/CurrencyContext';

interface MainLayoutProps {
  children: ReactNode;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/operaciones/nueva': 'Nueva Operación',
  '/operaciones': 'Todas las Operaciones',
  '/precios': 'Actualizar Precios',
  '/graficos': 'Gráficos',
  '/configuracion': 'Configuración',
};

const mobileNavItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/operaciones/nueva', label: 'Agregar', icon: '➕' },
  { href: '/operaciones', label: 'Ops', icon: '📋' },
  { href: '/precios', label: 'Precios', icon: '💰' },
  { href: '/graficos', label: 'Gráficos', icon: '📈' },
  { href: '/configuracion', label: 'Config', icon: '⚙️' },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const pathname = usePathname();

  // Find the page title — check for exact match then prefix match
  const title = pageTitles[pathname] ??
    Object.entries(pageTitles).find(([k]) => pathname.startsWith(k) && k !== '/')?.[1] ??
    'Portfolio Tracker';

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-[#1a1d29] border-b border-[#2d3348] px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-white font-semibold flex-1">{title}</h2>

          {/* Currency toggle */}
          <div className="flex items-center gap-1 bg-[#0f1117] border border-[#2d3348] rounded-lg p-0.5">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              US$
            </button>
            <button
              onClick={() => setCurrency('ARS')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                currency === 'ARS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ARS
            </button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d29] border-t border-[#2d3348] z-30">
          <div className="flex">
            {mobileNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                    ? 'text-blue-400'
                    : 'text-slate-500'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
