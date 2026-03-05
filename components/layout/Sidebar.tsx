'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Plus, List, TrendingUp, Settings, X, DollarSign } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: <BarChart2 size={20} /> },
  { href: '/operaciones/nueva', label: 'Nueva Operación', icon: <Plus size={20} /> },
  { href: '/operaciones', label: 'Todas las Operaciones', icon: <List size={20} /> },
  { href: '/precios', label: 'Actualizar Precios', icon: <DollarSign size={20} /> },
  { href: '/graficos', label: 'Gráficos', icon: <TrendingUp size={20} /> },
  { href: '/configuracion', label: 'Configuración', icon: <Settings size={20} /> },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1d29] border-r border-[#2d3348] min-h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative w-64 bg-[#1a1d29] border-r border-[#2d3348] flex flex-col">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent onLinkClick={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="p-6 border-b border-[#2d3348]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Portfolio</h1>
            <p className="text-slate-400 text-xs">Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onLinkClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive(item.href)
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#2d3348]">
        <p className="text-slate-500 text-xs text-center">CEDEARs & Acciones</p>
        <p className="text-slate-600 text-xs text-center">Cocos Capital Tracker</p>
      </div>
    </>
  );
}
