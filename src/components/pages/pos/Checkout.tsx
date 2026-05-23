'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import AdminLayout from '@/components/layout/AdminLayout';
import ShopCheckout from './checkout/ShopCheckout';
import RestaurantCheckout from './checkout/RestaurantCheckout';
import POSLoginScreen from './POSLoginScreen';

const Checkout = () => {
  const { session } = useAuth();
  const { shopSession } = useShopSession();
  const [activeEmployee, setActiveEmployee] = useState<any | null>(null);

  const handleLock = () => {
    setActiveEmployee(null);
  };

  // Detect session type (shop employee vs restaurant employee)
  const isRestaurant = !!(session?.restaurant_id || shopSession?.isRestaurant);

  // Inactivity session timer: locks terminal after inactivity (24 hours for shop, 2 minutes for restaurant)
  useEffect(() => {
    if (!activeEmployee) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const timeoutDuration = isRestaurant ? 120000 : 24 * 60 * 60 * 1000;
      timeoutId = setTimeout(() => {
        setActiveEmployee(null);
      }, timeoutDuration);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [activeEmployee, isRestaurant]);

  if (!activeEmployee) {
    return (
      <AdminLayout kioskMode={true}>
        <POSLoginScreen onLogin={setActiveEmployee} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout kioskMode={true}>
      {isRestaurant ? (
        <RestaurantCheckout activeEmployee={activeEmployee} onLock={handleLock} />
      ) : (
        <ShopCheckout activeEmployee={activeEmployee} onLock={handleLock} />
      )}
    </AdminLayout>
  );
};

export default Checkout;
