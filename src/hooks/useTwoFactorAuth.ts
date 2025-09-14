import { useState, useEffect } from 'react';
import { authenticator } from 'otplib';
import { useUpdateTwoFactorSecrets } from './useUpdateTwoFactorSecrets';

interface TwoFactorAuthData {
  secretKey: string;
  employeeId: string;
  shopId: string;
}

const TWO_FACTOR_SECRETS_KEY = 'twoFactorSecrets';

export function useTwoFactorAuth() {
  const [secrets, setSecrets] = useState<Record<string, TwoFactorAuthData>>({});

  // Load secrets from localStorage on mount
  useEffect(() => {
    console.log('=== LOADING 2FA SECRETS FROM LOCALSTORAGE ===');
    const storedSecrets = localStorage.getItem(TWO_FACTOR_SECRETS_KEY);
    console.log('Raw stored secrets:', storedSecrets);

    if (storedSecrets) {
      try {
        const parsedSecrets = JSON.parse(storedSecrets);
        console.log('Parsed secrets:', Object.keys(parsedSecrets));
        setSecrets(parsedSecrets);
      } catch (error) {
        console.error('Error parsing stored 2FA secrets:', error);
        localStorage.removeItem(TWO_FACTOR_SECRETS_KEY);
      }
    } else {
      console.log('No stored secrets found');
    }
  }, []);

  // Save secrets to localStorage whenever they change
  useEffect(() => {
    console.log('=== SAVING 2FA SECRETS TO LOCALSTORAGE ===');
    console.log('Saving secrets:', Object.keys(secrets));
    localStorage.setItem(TWO_FACTOR_SECRETS_KEY, JSON.stringify(secrets));
    console.log('Secrets saved to localStorage');
  }, [secrets]);

  const generateSecretKey = () => {
    return authenticator.generateSecret();
  };

  const storeSecretKey = (employeeId: string, shopId: string, secretKey: string) => {
    console.log('=== STORE SECRET KEY DEBUG ===');
    console.log('Storing Secret Key:', {
      employeeId,
      shopId,
      secretKey: secretKey ? `${secretKey.substring(0, 8)}...` : 'missing',
    });

    const key = `${employeeId}-${shopId}`;
    console.log('Storage key:', key);

    // Update state
    setSecrets(prev => {
      const newSecrets = {
        ...prev,
        [key]: {
          secretKey,
          employeeId,
          shopId,
        },
      };
      console.log('Updated secrets object:', Object.keys(newSecrets));

      // Immediately save to localStorage
      try {
        localStorage.setItem(TWO_FACTOR_SECRETS_KEY, JSON.stringify(newSecrets));
        console.log('Secret immediately saved to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }

      return newSecrets;
    });

    console.log('Secret key stored successfully');

    // Verify storage was successful
    setTimeout(() => {
      const stored = localStorage.getItem(TWO_FACTOR_SECRETS_KEY);
      console.log('=== VERIFICATION: STORAGE CHECK ===');
      console.log('Stored after save:', stored);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('Verification - Keys in localStorage:', Object.keys(parsed));
          console.log('Verification - Our key exists:', !!parsed[key]);
        } catch (error) {
          console.error('Verification - Error parsing:', error);
        }
      }
    }, 100);
  };

  const getSecretKey = (employeeId: string, shopId: string): string | null => {
    const key = `${employeeId}-${shopId}`;
    console.log('=== GET SECRET KEY DEBUG ===');
    console.log('Looking for key:', key);
    console.log('Available secrets:', Object.keys(secrets));
    console.log('Found secret:', secrets[key]);
    console.log('Returning secret key:', secrets[key]?.secretKey ? '***' : 'null');

    // Check localStorage directly as fallback
    const storedSecrets = localStorage.getItem(TWO_FACTOR_SECRETS_KEY);
    console.log('Direct localStorage check:', storedSecrets);
    if (storedSecrets) {
      try {
        const parsedSecrets = JSON.parse(storedSecrets);
        console.log('Parsed localStorage secrets:', Object.keys(parsedSecrets));
        const directSecret = parsedSecrets[key]?.secretKey;
        console.log('Direct secret from localStorage:', directSecret ? '***' : 'null');
        if (directSecret && !secrets[key]?.secretKey) {
          console.log('Found secret in localStorage but not in state - using localStorage');
          return directSecret;
        }
      } catch (error) {
        console.error('Error parsing localStorage secrets:', error);
      }
    }

    return secrets[key]?.secretKey || null;
  };

  const verifyToken = (token: string, secretKey: string): boolean => {
    console.log('TOTP Verification Debug:', {
      token,
      secretKey: secretKey ? `${secretKey.substring(0, 8)}...` : 'missing',
      tokenLength: token.length,
    });

    try {
      const result = authenticator.verify({
        token,
        secret: secretKey,
      });
      console.log('TOTP Verification Result:', result);
      return result;
    } catch (error) {
      console.error('TOTP Verification Error:', error);
      return false;
    }
  };

  const generateQRCodeUrl = (secretKey: string, shopName: string, employeeName: string): string => {
    return authenticator.keyuri(employeeName, shopName, secretKey);
  };

  // Debug function to check localStorage manually
  const debugLocalStorage = () => {
    console.log('=== DEBUG LOCALSTORAGE ===');
    const stored = localStorage.getItem(TWO_FACTOR_SECRETS_KEY);
    console.log('Raw localStorage:', stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Parsed localStorage:', parsed);
        console.log('Keys in localStorage:', Object.keys(parsed));
      } catch (error) {
        console.error('Error parsing localStorage:', error);
      }
    }
  };

  return {
    generateSecretKey,
    storeSecretKey,
    getSecretKey,
    verifyToken,
    generateQRCodeUrl,
    debugLocalStorage,
  };
}
