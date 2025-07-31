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

  // Debug logging for MOMO dialog state changes
  useEffect(() => {
    console.log('=== CUSTOMER DISPLAY: MOMO DIALOG STATE CHANGED ===');
    console.log('isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
    console.log('previousPaymentMethod:', previousPaymentMethod);
    console.log('current paymentMethod:', displayData.paymentMethod);
    console.log('Timestamp:', new Date().toISOString());
  }, [isMomoPaymentDialogOpen, previousPaymentMethod, displayData.paymentMethod]);

  // Function to manually open MOMO dialog
  const openMomoDialog = () => {
    console.log('=== MANUALLY OPENING MOMO DIALOG ===');
    setIsMomoPaymentDialogOpen(true);
  };

  // Function to manually close MOMO dialog
  const closeMomoDialog = () => {
    console.log('=== MANUALLY CLOSING MOMO DIALOG ===');
    setIsMomoPaymentDialogOpen(false);
  };

  // Expose close function to window for direct communication
  useEffect(() => {
    (window as any).closeMomoDialog = closeMomoDialog;
    console.log('=== CUSTOMER DISPLAY: EXPOSED closeMomoDialog FUNCTION ===');
    return () => {
      delete (window as any).closeMomoDialog;
      console.log('=== CUSTOMER DISPLAY: REMOVED closeMomoDialog FUNCTION ===');
    };
  }, []);

  // Fetch real-time data from localStorage
  const fetchDisplayData = () => {
    try {
      const cartData = localStorage.getItem('customerDisplayCart');
      const shopData = localStorage.getItem('customerDisplayShop');
      const paymentData = localStorage.getItem('customerDisplayPayment');
      const momoDialogState = localStorage.getItem('momoDialogState');
      
      console.log('=== CUSTOMER DISPLAY: FETCHING DATA ===');
      console.log('cartData exists:', !!cartData);
      console.log('shopData exists:', !!shopData);
      console.log('paymentData exists:', !!paymentData);
      console.log('momoDialogState exists:', !!momoDialogState);
      console.log('momoDialogState value:', momoDialogState);
      
      if (cartData) {
        const cart = JSON.parse(cartData);
        const shopDetails = shopData ? JSON.parse(shopData) : displayData.shopDetails;
        const paymentInfo = paymentData ? JSON.parse(paymentData) : { paymentMethod: 'pending', discount: 0 };
        
        const newPaymentMethod = paymentInfo.paymentMethod;
        
        console.log('=== CUSTOMER DISPLAY: PAYMENT METHOD ANALYSIS ===');
        console.log('Previous payment method:', previousPaymentMethod);
        console.log('New payment method:', newPaymentMethod);
        console.log('Current MOMO dialog state:', isMomoPaymentDialogOpen);
        
        setDisplayData({
          cart,
          shopDetails,
          timestamp: new Date().toISOString(),
          paymentMethod: newPaymentMethod,
          discount: paymentInfo.discount || 0
        });

        // Check if payment method changed to MOMO and show dialog
        if (newPaymentMethod === 'momo' && previousPaymentMethod !== 'momo') {
          console.log('=== CUSTOMER DISPLAY: MOMO PAYMENT DETECTED ===');
          console.log('Previous payment method:', previousPaymentMethod);
          console.log('New payment method:', newPaymentMethod);
          console.log('Opening MOMO payment dialog');
          setIsMomoPaymentDialogOpen(true);
        }
        
        // Debug logging
        if (newPaymentMethod !== previousPaymentMethod) {
          console.log('=== CUSTOMER DISPLAY: PAYMENT METHOD CHANGED ===');
          console.log('From:', previousPaymentMethod, 'To:', newPaymentMethod);
        }
        
        // Update previous payment method
        setPreviousPaymentMethod(newPaymentMethod);
      }

      // Check MOMO dialog state from localStorage
      if (momoDialogState) {
        try {
          const dialogState = JSON.parse(momoDialogState);
          console.log('=== CUSTOMER DISPLAY: PARSING MOMO DIALOG STATE ===');
          console.log('Parsed dialogState:', dialogState);
          console.log('dialogState.shouldClose:', dialogState.shouldClose);
          console.log('isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
          
          if (dialogState.shouldClose && isMomoPaymentDialogOpen) {
            console.log('=== CUSTOMER DISPLAY: CLOSING MOMO DIALOG FROM STORAGE ===');
            console.log('Dialog state:', dialogState);
            setIsMomoPaymentDialogOpen(false);
            localStorage.removeItem('momoDialogState');
            console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSED SUCCESSFULLY ===');
          } else {
            console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSE CONDITIONS NOT MET ===');
            console.log('shouldClose:', dialogState.shouldClose);
            console.log('isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
          }
        } catch (error) {
          console.error('Error parsing momoDialogState:', error);
          console.log('Raw momoDialogState value:', momoDialogState);
        }
      }
    } catch (error) {
      console.error('Error fetching display data:', error);
    }
  };

  // Auto-refresh every 1 second for real-time updates
  useEffect(() => {
    console.log('=== CUSTOMER DISPLAY: SETTING UP DATA FETCHING ===');
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 1000);
    
    // Add event listener for direct communication
    const handleMomoDialogClose = (event: StorageEvent) => {
      console.log('=== CUSTOMER DISPLAY: STORAGE EVENT RECEIVED ===');
      console.log('Event key:', event.key);
      console.log('Event newValue:', event.newValue);
      console.log('Event oldValue:', event.oldValue);
      
      if (event.key === 'momoDialogState' && event.newValue) {
        try {
          const dialogState = JSON.parse(event.newValue);
          console.log('=== CUSTOMER DISPLAY: PARSING STORAGE EVENT ===');
          console.log('Parsed dialogState from event:', dialogState);
          console.log('dialogState.shouldClose:', dialogState.shouldClose);
          console.log('isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
          
          if (dialogState.shouldClose && isMomoPaymentDialogOpen) {
            console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSE EVENT RECEIVED ===');
            setIsMomoPaymentDialogOpen(false);
            localStorage.removeItem('momoDialogState');
            console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSED FROM STORAGE EVENT ===');
          }
        } catch (error) {
          console.error('Error parsing momoDialogState from event:', error);
          console.log('Raw event newValue:', event.newValue);
        }
      }
    };

    // Add custom event listener for immediate communication
    const handleCustomMomoClose = () => {
      console.log('=== CUSTOMER DISPLAY: CUSTOM MOMO DIALOG CLOSE EVENT ===');
      console.log('Current isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
      setIsMomoPaymentDialogOpen(false);
      console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSED FROM CUSTOM EVENT ===');
    };

    window.addEventListener('storage', handleMomoDialogClose);
    window.addEventListener('momoDialogClose', handleCustomMomoClose);
    
    console.log('=== CUSTOMER DISPLAY: EVENT LISTENERS ADDED ===');
    console.log('storage event listener added');
    console.log('momoDialogClose event listener added');
    
    return () => {
      console.log('=== CUSTOMER DISPLAY: CLEANING UP EVENT LISTENERS ===');
      clearInterval(interval);
      window.removeEventListener('storage', handleMomoDialogClose);
      window.removeEventListener('momoDialogClose', handleCustomMomoClose);
    };
  }, [isMomoPaymentDialogOpen]);

  // useEffect to close MOMO dialog when user navigates away from /pos page
  useEffect(() => {
    console.log('=== CUSTOMER DISPLAY: SETTING UP NAVIGATION LISTENERS ===');
    console.log('Current isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
    
    const handleBeforeUnload = () => {
      if (isMomoPaymentDialogOpen) {
        console.log('=== CUSTOMER DISPLAY: USER NAVIGATING AWAY, CLOSING MOMO DIALOG ===');
        setIsMomoPaymentDialogOpen(false);
      }
    };

    const handleVisibilityChange = () => {
      console.log('=== CUSTOMER DISPLAY: VISIBILITY CHANGED ===');
      console.log('Visibility state:', document.visibilityState);
      console.log('isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
      
      if (document.visibilityState === 'hidden' && isMomoPaymentDialogOpen) {
        console.log('=== CUSTOMER DISPLAY: PAGE HIDDEN, CLOSING MOMO DIALOG ===');
        setIsMomoPaymentDialogOpen(false);
      }
    };

    // Listen for page unload/visibility changes
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('=== CUSTOMER DISPLAY: CLEANING UP NAVIGATION LISTENERS ===');
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

  console.log('=== CUSTOMER DISPLAY: RENDERING ===');
  console.log('isMomoPaymentDialogOpen:', isMomoPaymentDialogOpen);
  console.log('paymentMethod:', displayData.paymentMethod);
  console.log('cart items:', displayData.cart.length);

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
          console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSED ===');
          console.log('onClose called, current state:', isMomoPaymentDialogOpen);
          setIsMomoPaymentDialogOpen(false);
          console.log('=== CUSTOMER DISPLAY: MOMO DIALOG STATE SET TO FALSE ===');
        }}
        onPaymentConfirmed={() => {
          console.log('=== CUSTOMER DISPLAY: MOMO PAYMENT CONFIRMED ===');
          console.log('onPaymentConfirmed called, current state:', isMomoPaymentDialogOpen);
          setIsMomoPaymentDialogOpen(false);
          console.log('=== CUSTOMER DISPLAY: MOMO DIALOG CLOSED AFTER PAYMENT CONFIRMATION ===');
        }}
        total={total}
        transactionId={'TXN-' + Date.now().toString().slice(-6)}
      />
    </>
  );
} 