'use client';

import dynamic from 'next/dynamic';

const Shops = dynamic(() => import('@/components/pages/Shops'), {
  ssr: false,
});

export default function ShopsPage() {
  return <Shops />;
}
