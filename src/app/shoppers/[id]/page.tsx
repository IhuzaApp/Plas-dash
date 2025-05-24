'use client';

import ShopperDetails from '@/components/pages/ShopperDetails';
import { useParams } from 'next/navigation';

export default function ShopperDetailsPage() {
  const params = useParams();
  const shopperId = params.id as string;
  
  return <ShopperDetails shopperId={shopperId} />;
} 