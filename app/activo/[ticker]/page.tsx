import { MainLayout } from '@/components/layout/MainLayout';
import { AssetDetailPage } from '@/components/assetdetail/AssetDetailPage';

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export default async function ActivoPage({ params }: PageProps) {
  const { ticker } = await params;

  return (
    <MainLayout>
      <AssetDetailPage ticker={ticker.toUpperCase()} />
    </MainLayout>
  );
}
