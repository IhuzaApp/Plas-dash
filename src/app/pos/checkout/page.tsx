'use client';

import dynamic from 'next/dynamic';

const Checkout = dynamic(() => import('@/components/pages/pos/Checkout'), {
  ssr: false,
});

export default function CheckoutPage() {
  return <Checkout />;
}
