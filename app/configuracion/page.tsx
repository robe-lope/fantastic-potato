'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export default function ConfiguracionPage() {
  const { toasts, showToast, removeToast } = useToast();

  return (
    <MainLayout>
      <SettingsPage showToast={showToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  );
}
