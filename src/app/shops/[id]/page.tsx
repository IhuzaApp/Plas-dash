'use client';

import dynamic from 'next/dynamic';

const ShopDetail = dynamic(() => import('@/components/pages/ShopDetail'), {
  ssr: false,
});

export default function ShopDetailPage() {
  return <ShopDetail />;
}
