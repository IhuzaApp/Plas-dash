'use client';

import React, { useState, useEffect } from 'react';
import CustomerDisplay from '@/components/customer-display/CustomerDisplay';
import MomoPaymentDialog from '@/components/customer-display/MomoPaymentDialog';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface CustomerDisplayData {
  cart: CartItem[];
  shopDetails?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  timestamp: string;
  paymentMethod?: string;
  discount?: number;
}

export default function CustomerDisplayPage() {
  const [displayData, setDisplayData] = useState<CustomerDisplayData>({
    cart: [],
    shopDetails: {
      name: 'Shop Name',
      address: 'Shop Address',
      phone: 'Phone',
      email: 'Email'
    },
    timestamp: new Date().toISOString(),
    paymentMethod: 'pending',
    discount: 0
  });

  const [isMomoPaymentDialogOpen, setIsMomoPaymentDialogOpen] = useState(false);
  const [previousPaymentMethod, setPreviousPaymentMethod] = useState<string>('pending');

  // Function to manually open MOMO dialog
  const openMomoDialog = () => {
    setIsMomoPaymentDialogOpen(true);
  };

  // Function to manually close MOMO dialog
  const closeMomoDialog = () => {
    setIsMomoPaymentDialogOpen(false);
  };

  // Expose close function to window for direct communication
  useEffect(() => {
    (window as any).closeMomoDialog = closeMomoDialog;
    return () => {
      delete (window as any).closeMomoDialog;
    };
  }, []);

  // Fetch real-time data from localStorage
  const fetchDisplayData = () => {
    try {
      const cartData = localStorage.getItem('customerDisplayCart');
      const shopData = localStorage.getItem('customerDisplayShop');
      const paymentData = localStorage.getItem('customerDisplayPayment');
      const momoDialogState = localStorage.getItem('momoDialogState');
      
      if (cartData) {
        const cart = JSON.parse(cartData);
        const shopDetails = shopData ? JSON.parse(shopData) : displayData.shopDetails;
        const paymentInfo = paymentData ? JSON.parse(paymentData) : { paymentMethod: 'pending', discount: 0 };
        
        const newPaymentMethod = paymentInfo.paymentMethod;
        
        setDisplayData({
          cart,
          shopDetails,
          timestamp: new Date().toISOString(),
          paymentMethod: newPaymentMethod,
          discount: paymentInfo.discount || 0
        });

        // Check if payment method changed to MOMO and show dialog
        if (newPaymentMethod === 'momo' && previousPaymentMethod !== 'momo') {
          setIsMomoPaymentDialogOpen(true);
        }
        
        // Update previous payment method
        setPreviousPaymentMethod(newPaymentMethod);
      }

      // Check MOMO dialog state from localStorage
      if (momoDialogState) {
        try {
          const dialogState = JSON.parse(momoDialogState);
          if (dialogState.shouldClose && isMomoPaymentDialogOpen) {
            setIsMomoPaymentDialogOpen(false);
            localStorage.removeItem('momoDialogState');
          }
        } catch (error) {
          console.error('Error parsing momoDialogState:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching display data:', error);
    }
  };

  // Auto-refresh every 1 second for real-time updates
  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 1000);
    
    // Add event listener for direct communication
    const handleMomoDialogClose = (event: StorageEvent) => {
      if (event.key === 'momoDialogState' && event.newValue) {
        try {
          const dialogState = JSON.parse(event.newValue);
          if (dialogState.shouldClose && isMomoPaymentDialogOpen) {
            setIsMomoPaymentDialogOpen(false);
            localStorage.removeItem('momoDialogState');
          }
        } catch (error) {
          console.error('Error parsing momoDialogState from event:', error);
        }
      }
    };

    // Add custom event listener for immediate communication
    const handleCustomMomoClose = () => {
      setIsMomoPaymentDialogOpen(false);
    };

    window.addEventListener('storage', handleMomoDialogClose);
    window.addEventListener('momoDialogClose', handleCustomMomoClose);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleMomoDialogClose);
      window.removeEventListener('momoDialogClose', handleCustomMomoClose);
    };
  }, [isMomoPaymentDialogOpen]);

  // useEffect to close MOMO dialog when user navigates away from /pos page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isMomoPaymentDialogOpen) {
        setIsMomoPaymentDialogOpen(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isMomoPaymentDialogOpen) {
        setIsMomoPaymentDialogOpen(false);
      }
    };

    // Listen for page unload/visibility changes
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMomoPaymentDialogOpen]);

  const calculateSubtotal = () => {
    return displayData.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * (displayData.discount || 0)) / 100;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return (subtotal - discountAmount) * 0.08;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const tax = calculateTax();
    return subtotal - discountAmount + tax;
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <>
      <CustomerDisplay
        cart={displayData.cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        tax={tax}
        total={total}
        discount={displayData.discount || 0}
        paymentMethod={displayData.paymentMethod || 'pending'}
      />

      {/* MOMO Payment Dialog */}
      <MomoPaymentDialog
        isOpen={isMomoPaymentDialogOpen}
        onClose={() => {
          setIsMomoPaymentDialogOpen(false);
        }}
        onPaymentConfirmed={() => {
          setIsMomoPaymentDialogOpen(false);
        }}
        total={total}
        transactionId={'TXN-' + Date.now().toString().slice(-6)}
      />
    </>
  );
} 