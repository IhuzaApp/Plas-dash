import { useState, useEffect } from 'react';
import { authenticator } from 'otplib';

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
    const storedSecrets = localStorage.getItem(TWO_FACTOR_SECRETS_KEY);
    if (storedSecrets) {
      try {
        setSecrets(JSON.parse(storedSecrets));
      } catch (error) {
        console.error('Error parsing stored 2FA secrets:', error);
        localStorage.removeItem(TWO_FACTOR_SECRETS_KEY);
      }
    }
  }, []);

  // Save secrets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(TWO_FACTOR_SECRETS_KEY, JSON.stringify(secrets));
  }, [secrets]);

  const generateSecretKey = () => {
    return authenticator.generateSecret();
  };

  const storeSecretKey = (employeeId: string, shopId: string, secretKey: string) => {
    console.log('Storing Secret Key:', {
      employeeId,
      shopId,
      secretKey: secretKey ? `${secretKey.substring(0, 8)}...` : 'missing',
    });

    const key = `${employeeId}-${shopId}`;
    setSecrets(prev => ({
      ...prev,
      [key]: {
        secretKey,
        employeeId,
        shopId,
      },
    }));

    console.log('Secret key stored successfully');
  };

  const getSecretKey = (employeeId: string, shopId: string): string | null => {
    const key = `${employeeId}-${shopId}`;
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

  return {
    generateSecretKey,
    storeSecretKey,
    getSecretKey,
    verifyToken,
    generateQRCodeUrl,
  };
}
