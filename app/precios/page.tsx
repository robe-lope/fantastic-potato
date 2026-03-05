'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { UpdatePricesPage } from '@/components/prices/UpdatePricesPage';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export default function PreciosPage() {
  const { toasts, showToast, removeToast } = useToast();

  return (
    <MainLayout>
      <UpdatePricesPage showToast={showToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  );
}
