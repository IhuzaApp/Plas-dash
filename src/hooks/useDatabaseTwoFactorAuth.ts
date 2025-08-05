import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticator } from 'otplib';
import { hasuraRequest } from '../lib/hasura';
import { UPDATE_ORG_EMPLOYEE_TWO_FACTOR_SECRETS } from '../lib/graphql/mutations';

interface TwoFactorSecret {
  secretKey: string;
  employeeId: string;
  shopId: string;
}

interface TwoFactorSecrets {
  [key: string]: TwoFactorSecret;
}

export function useDatabaseTwoFactorAuth() {
  const queryClient = useQueryClient();

  const updateTwoFactorSecretsMutation = useMutation({
    mutationFn: async ({ 
      employeeId, 
      twoFactorSecrets 
    }: { 
      employeeId: string; 
      twoFactorSecrets: string; 
    }) => {
      return hasuraRequest(UPDATE_ORG_EMPLOYEE_TWO_FACTOR_SECRETS, {
        id: employeeId,
        twoFactorSecrets,
      });
    },
    onSuccess: (data) => {
      console.log('=== DATABASE UPDATE SUCCESS ===');
      console.log('Update result:', data);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orgEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.invalidateQueries({ queryKey: ['userShops'] });
      
      // Force refetch current user data
      queryClient.refetchQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.refetchQueries({ queryKey: ['userShops'] });
      
      // Also remove and refetch to ensure fresh data
      queryClient.removeQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.refetchQueries({ queryKey: ['currentOrgEmployee'] });
      
      console.log('Queries invalidated and refetched');
      
      // Dispatch custom event to force UI updates
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orgEmployeeDataUpdated'));
      }, 100);
    },
  });

  const generateSecretKey = () => {
    return authenticator.generateSecret();
  };

  const storeSecretKey = async (
    employeeId: string, 
    shopId: string, 
    secretKey: string,
    existingSecrets: string | null = null,
    uuid: string // Add UUID parameter
  ) => {
    console.log('=== STORE SECRET KEY TO DATABASE ===');
    console.log('Storing Secret Key:', {
      employeeId,
      shopId,
      secretKey: secretKey ? `${secretKey.substring(0, 8)}...` : 'missing',
    });

    const key = `${employeeId}-${shopId}`;
    console.log('Storage key:', key);

    // Parse existing secrets or start with empty object
    let secrets: TwoFactorSecrets = {};
    if (existingSecrets) {
      try {
        secrets = JSON.parse(existingSecrets);
        console.log('Existing secrets from database:', Object.keys(secrets));
      } catch (error) {
        console.error('Error parsing existing secrets:', error);
        secrets = {};
      }
    }

    // Add new secret
    secrets[key] = {
      secretKey,
      employeeId,
      shopId,
    };

    console.log('Updated secrets object:', Object.keys(secrets));
    console.log('Total secrets to store:', Object.keys(secrets).length);

    // Store in database
    const secretsJson = JSON.stringify(secrets);
    console.log('Secrets JSON to store:', secretsJson);

    try {
      const result = await updateTwoFactorSecretsMutation.mutateAsync({
        employeeId: uuid, // Use UUID instead of employeeId
        twoFactorSecrets: secretsJson,
      });
      console.log('Secret stored in database successfully:', result);
      return result;
    } catch (error) {
      console.error('Error storing secret in database:', error);
      throw error;
    }
  };

  const getSecretKey = (
    employeeId: string, 
    shopId: string, 
    storedSecrets: string | null,
    uuid?: string // Add optional UUID parameter for debugging
  ): string | null => {
    console.log('=== GET SECRET KEY FROM DATABASE ===');
    console.log('Looking for key:', `${employeeId}-${shopId}`);
    console.log('UUID for debugging:', uuid);
    console.log('Stored secrets from database:', storedSecrets);

    if (!storedSecrets) {
      console.log('No stored secrets found in database');
      return null;
    }

    try {
      const secrets: TwoFactorSecrets = JSON.parse(storedSecrets);
      console.log('Parsed secrets from database:', Object.keys(secrets));
      
      const key = `${employeeId}-${shopId}`;
      const secret = secrets[key];
      
      console.log('Found secret:', secret ? '***' : 'null');
      return secret?.secretKey || null;
    } catch (error) {
      console.error('Error parsing secrets from database:', error);
      return null;
    }
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
    isLoading: updateTwoFactorSecretsMutation.isPending,
    error: updateTwoFactorSecretsMutation.error,
  };
} 