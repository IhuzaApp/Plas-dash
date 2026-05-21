'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import AdminLayout from '@/components/layout/AdminLayout';
import ShopCheckout from './checkout/ShopCheckout';
import RestaurantCheckout from './checkout/RestaurantCheckout';

const Checkout = () => {
  const { session } = useAuth();
  const { shopSession } = useShopSession();

  // Detect session type (shop employee vs restaurant employee)
  const isRestaurant = !!(session?.restaurant_id || shopSession?.isRestaurant);

  return (
    <AdminLayout kioskMode={true}>
      {isRestaurant ? <RestaurantCheckout /> : <ShopCheckout />}
    </AdminLayout>
  );
};

export default Checkout;
