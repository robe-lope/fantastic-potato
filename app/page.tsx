import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/components/dashboard/DashboardPage';

export default function HomePage() {
  return (
    <MainLayout>
      <DashboardPage />
    </MainLayout>
  );
}
