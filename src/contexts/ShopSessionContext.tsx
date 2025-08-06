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
    console.log('=== SHOP SESSION: LOADING FROM STORAGE ===');
    console.log('Component mount time:', new Date().toISOString());
    console.log('Main session at mount:', session);
    
    const sessionStr = localStorage.getItem(SHOP_SESSION_KEY);
    console.log('Shop session from localStorage:', sessionStr);
    
    if (sessionStr) {
      try {
        const sessionData = JSON.parse(sessionStr);
        const now = Date.now();
        const expiresAt = sessionData.expiresAt || 0;
        console.log('Parsed shop session data:', sessionData);
        console.log('Current time:', now);
        console.log('Session expires at:', expiresAt);
        console.log('Is session valid?', expiresAt && now < expiresAt);

        // Check if session is still valid (same logic as main session)
        if (expiresAt && now < expiresAt) {
          console.log('Setting valid shop session:', sessionData);
          setShopSession(sessionData);
        } else {
          // Session expired, remove it
          console.log('Shop session expired, removing from storage');
          localStorage.removeItem(SHOP_SESSION_KEY);
          setShopSession(null);
        }
      } catch (error) {
        console.error('Error parsing shop session:', error);
        localStorage.removeItem(SHOP_SESSION_KEY);
        setShopSession(null);
      }
    } else {
      console.log('No shop session found in storage');
      setShopSession(null);
    }
  }, []); // No dependencies - same as main session

  // Clear shop session when main session changes (user logs out)
  useEffect(() => {
    console.log('=== SHOP SESSION: MAIN SESSION EFFECT ===');
    console.log('Main session changed:', session);
    console.log('Current shop session state:', shopSession);
    console.log('localStorage shop session before:', localStorage.getItem(SHOP_SESSION_KEY));
    
    // Check if main session exists in localStorage (to detect if it's just loading)
    const mainSessionStr = localStorage.getItem('orgEmployeeSession');
    const hasMainSessionInStorage = !!mainSessionStr;
    
    console.log('Main session in localStorage:', hasMainSessionInStorage);
    
    // Only clear shop session if main session is null AND there's no main session in localStorage
    // This prevents clearing during the initial load when main session is temporarily null
    if (!session && !hasMainSessionInStorage && shopSession) {
      console.log('Main session truly lost (not in localStorage), clearing shop session');
      localStorage.removeItem(SHOP_SESSION_KEY);
      setShopSession(null);
    } else if (session) {
      console.log('Main session present, keeping shop session');
    } else if (!session && hasMainSessionInStorage) {
      console.log('Main session null but exists in localStorage (loading), keeping shop session');
    } else {
      console.log('No main session and no shop session to clear');
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
      console.log('=== SHOP SESSION: LOGIN TRIGGERED ===');
      console.log('Login parameters:', { shopId, shopName, employeeId, employeeName, position });
      
      const expiresAt = Date.now() + SHOP_SESSION_DURATION;
      const newShopSession: ShopSession = {
        shopId,
        shopName,
        employeeId,
        employeeName,
        position,
        expiresAt,
      };

      console.log('New shop session object:', newShopSession);
      console.log('Session expires at:', new Date(expiresAt).toISOString());

      // Save to localStorage (same approach as main session)
      localStorage.setItem(SHOP_SESSION_KEY, JSON.stringify(newShopSession));
      console.log('Shop session saved to localStorage');
      
      setShopSession(newShopSession);
      console.log('Shop session state updated');
    },
    []
  );

  const logoutFromShop = useCallback(() => {
    console.log('=== SHOP SESSION: LOGOUT TRIGGERED ===');
    localStorage.removeItem(SHOP_SESSION_KEY);
    setShopSession(null);
    console.log('Shop session cleared from localStorage');
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
  
  console.log('=== SHOP SESSION: STATE UPDATE ===');
  console.log('shopSession:', shopSession);
  console.log('isLoggedIntoShop:', isLoggedIntoShop);

  const value: ShopSessionContextType = {
    shopSession,
    isLoggedIntoShop,
    loginToShop,
    logoutFromShop,
    getShopSessionExpiry,
    debugSession,
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