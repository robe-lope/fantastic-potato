import { type ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { Page } from '../../types';

interface MainLayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
  title: string;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  'nueva-operacion': 'Nueva Operación',
  operaciones: 'Todas las Operaciones',
  graficos: 'Gráficos',
  configuracion: 'Configuración',
};

export function MainLayout({ currentPage, onNavigate, children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
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
          <h2 className="text-white font-semibold">{title || pageTitles[currentPage]}</h2>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d29] border-t border-[#2d3348] z-30">
          <div className="flex">
            {[
              { id: 'dashboard' as Page, label: 'Dashboard', icon: '📊' },
              { id: 'nueva-operacion' as Page, label: 'Agregar', icon: '➕' },
              { id: 'operaciones' as Page, label: 'Ops', icon: '📋' },
              { id: 'graficos' as Page, label: 'Gráficos', icon: '📈' },
              { id: 'configuracion' as Page, label: 'Config', icon: '⚙️' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  currentPage === item.id ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
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
