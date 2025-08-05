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
}

const ShopSessionContext = createContext<ShopSessionContextType | undefined>(undefined);

const SHOP_SESSION_KEY = 'shopSession';
const SHOP_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function ShopSessionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [shopSession, setShopSession] = useState<ShopSession | null>(null);

  // Load shop session from localStorage on mount
  useEffect(() => {
    const sessionStr = localStorage.getItem(SHOP_SESSION_KEY);
    if (sessionStr) {
      try {
        const sessionData = JSON.parse(sessionStr);
        const now = Date.now();

        // Check if session is still valid
        if (sessionData.expiresAt && now < sessionData.expiresAt) {
          setShopSession(sessionData);
        } else {
          // Session expired, remove it
          localStorage.removeItem(SHOP_SESSION_KEY);
          setShopSession(null);
        }
      } catch (error) {
        console.error('Error parsing shop session:', error);
        localStorage.removeItem(SHOP_SESSION_KEY);
        setShopSession(null);
      }
    }
  }, []);

  // Clear shop session when main session changes (user logs out)
  useEffect(() => {
    if (!session) {
      localStorage.removeItem(SHOP_SESSION_KEY);
      setShopSession(null);
    }
  }, [session]);

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

  const isLoggedIntoShop = !!shopSession;

  const value: ShopSessionContextType = {
    shopSession,
    isLoggedIntoShop,
    loginToShop,
    logoutFromShop,
    getShopSessionExpiry,
  };

  return (
    <ShopSessionContext.Provider value={value}>
      {children}
    </ShopSessionContext.Provider>
  );
}

export function useShopSession(): ShopSessionContextType {
  const context = useContext(ShopSessionContext);
  if (context === undefined) {
    throw new Error('useShopSession must be used within a ShopSessionProvider');
  }
  return context;
} 