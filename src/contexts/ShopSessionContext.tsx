import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/layout/RootLayout';

interface ShopSession {
  shopId: string;
  shopName: string;
  employeeId: string;
  employeeName: string;
  position: string;
  expiresAt: number;
}

interface ShopSessionContextType {
  shopSession: ShopSession | null;
  isLoggedIntoShop: boolean;
  loginToShop: (
    shopId: string,
    shopName: string,
    employeeId: string,
    employeeName: string,
    position: string
  ) => void;
  logoutFromShop: () => void;
  getShopSessionExpiry: () => number | null;
  debugSession: () => void;
}

const ShopSessionContext = createContext<ShopSessionContextType | undefined>(undefined);

const SHOP_SESSION_KEY = 'shopSession';
const SHOP_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function ShopSessionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [shopSession, setShopSession] = useState<ShopSession | null>(null);

  // Load shop session from localStorage on mount (same approach as main session)
  useEffect(() => {
    const sessionStr = localStorage.getItem(SHOP_SESSION_KEY);

    if (sessionStr) {
      try {
        const sessionData = JSON.parse(sessionStr);
        const now = Date.now();
        const expiresAt = sessionData.expiresAt || 0;

        // Check if session is still valid (same logic as main session)
        if (expiresAt && now < expiresAt) {
          setShopSession(sessionData);
        } else {
          // Session expired, remove it
          localStorage.removeItem(SHOP_SESSION_KEY);
          setShopSession(null);
        }
      } catch (error) {
        localStorage.removeItem(SHOP_SESSION_KEY);
        setShopSession(null);
      }
    } else {
      setShopSession(null);
    }
  }, []); // No dependencies - same as main session

  // Clear shop session when main session changes (user logs out)
  useEffect(() => {
    // Check if main session exists in localStorage (to detect if it's just loading)
    const mainSessionStr = localStorage.getItem('orgEmployeeSession');
    const hasMainSessionInStorage = !!mainSessionStr;

    // Only clear shop session if main session is null AND there's no main session in localStorage
    // This prevents clearing during the initial load when main session is temporarily null
    if (!session && !hasMainSessionInStorage && shopSession) {
      localStorage.removeItem(SHOP_SESSION_KEY);
      setShopSession(null);
    }
  }, [session, shopSession]); // Depend on both to track the state properly

  const loginToShop = useCallback(
    (
      shopId: string,
      shopName: string,
      employeeId: string,
      employeeName: string,
      position: string
    ) => {
      const expiresAt = Date.now() + SHOP_SESSION_DURATION;
      const newShopSession: ShopSession = {
        shopId,
        shopName,
        employeeId,
        employeeName,
        position,
        expiresAt,
      };

      // Save to localStorage (same approach as main session)
      localStorage.setItem(SHOP_SESSION_KEY, JSON.stringify(newShopSession));
      setShopSession(newShopSession);
    },
    []
  );

  const logoutFromShop = useCallback(() => {
    localStorage.removeItem(SHOP_SESSION_KEY);
    setShopSession(null);
  }, []);

  const getShopSessionExpiry = useCallback(() => {
    return shopSession?.expiresAt || null;
  }, [shopSession]);

  // Debug function to check session status
  const debugSession = useCallback(() => {
    console.log('=== SHOP SESSION DEBUG ===');
    console.log('Current state:', shopSession);
    console.log('localStorage value:', localStorage.getItem(SHOP_SESSION_KEY));
    console.log('Main session:', session);
    console.log('Is logged into shop:', !!shopSession);
  }, [shopSession, session]);

  const isLoggedIntoShop = !!shopSession;

  const value: ShopSessionContextType = {
    shopSession,
    isLoggedIntoShop,
    loginToShop,
    logoutFromShop,
    getShopSessionExpiry,
    debugSession,
  };

  return <ShopSessionContext.Provider value={value}>{children}</ShopSessionContext.Provider>;
}

export function useShopSession(): ShopSessionContextType {
  const context = useContext(ShopSessionContext);
  if (context === undefined) {
    throw new Error('useShopSession must be used within a ShopSessionProvider');
  }
  return context;
}
