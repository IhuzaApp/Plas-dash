import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ShopSession {
  shopId: string;
  shopName: string;
  employeeId: string;
  employeeName: string;
  position: string;
  expiresAt: number;
  isRestaurant?: boolean;
}

interface ShopSessionContextType {
  shopSession: ShopSession | null;
  isLoggedIntoShop: boolean;
  loginToShop: (
    shopId: string,
    shopName: string,
    employeeId: string,
    employeeName: string,
    position: string,
    isRestaurant?: boolean
  ) => void;
  logoutFromShop: () => void;
  getShopSessionExpiry: () => number | null;
  debugSession: () => void;
  activeBusiness: { id: string; name: string; type: string; logo?: string | null } | null;
}

const ShopSessionContext = createContext<ShopSessionContextType | undefined>(undefined);

const SHOP_SESSION_KEY = 'shopSession';
const SHOP_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function ShopSessionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [shopSession, setShopSession] = useState<ShopSession | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<{ id: string; name: string; type: string; logo?: string | null } | null>(null);

  // Detect business context from cookie or hostname
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const fetchBusinessDetails = async (params: string) => {
      try {
        const response = await fetch(`/api/business/lookup?${params}`);
        if (response.ok) {
          const business = await response.json();
          setActiveBusiness({
            id: business.id,
            name: business.name,
            type: business.type,
            logo: business.logo,
          });
        }
      } catch (e) {
        console.error('Failed to fetch business details');
      }
    };

    const businessId = getCookie('business-id');
    if (businessId) {
      fetchBusinessDetails(`id=${businessId}`);
    } else {
      // Fallback: extract subdomain from hostname if cookie is missing
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'plas.rw';
      
      if (!['localhost', 'dash.' + rootDomain, rootDomain].includes(hostname)) {
        let subdomain = '';
        if (hostname.endsWith('.' + rootDomain)) subdomain = hostname.replace('.' + rootDomain, '');
        else if (hostname.endsWith('.lvh.me')) subdomain = hostname.replace('.lvh.me', '');
        
        if (subdomain && subdomain !== 'www' && subdomain !== 'dash') {
          fetchBusinessDetails(`subdomain=${subdomain}`);
        }
      }
    }
  }, []);

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
      position: string,
      isRestaurant?: boolean
    ) => {
      const expiresAt = Date.now() + SHOP_SESSION_DURATION;
      const newShopSession: ShopSession = {
        shopId,
        shopName,
        employeeId,
        employeeName,
        position,
        expiresAt,
        isRestaurant,
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
    activeBusiness,
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
