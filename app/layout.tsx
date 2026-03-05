import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/contexts/DataContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export const metadata: Metadata = {
  title: 'Portfolio Tracker',
  description: 'Seguimiento de CEDEARs y acciones locales argentinas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CurrencyProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
