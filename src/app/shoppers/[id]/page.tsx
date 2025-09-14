'use client';

import ShopperDetails from '@/components/pages/ShopperDetails';
import { useParams } from 'next/navigation';

export default function ShopperDetailsPage() {
  const params = useParams();
  if (!params?.id) {
    return <div>Invalid shopper ID</div>;
  }
  const shopperId = params.id as string;

  return <ShopperDetails shopperId={shopperId} />;
}
