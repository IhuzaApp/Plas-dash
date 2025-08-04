'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Loader2, Store, Shield, Clock, AlertTriangle, Smartphone } from 'lucide-react';
import { useShopSession } from '@/hooks/useShopSession';
import { useUpdateMultAuth } from '@/hooks/useUpdateMultAuth';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import QRCode from 'qrcode';

interface ShopAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
  employeeId: string;
  employeeName: string;
  position: string;
  multAuthEnabled: boolean;
  userId: string; // This should be the UUID from the orgEmployees table
}

type FormData = {
  twoFactorCode: string;
  setupCode?: string;
  confirmSetupCode?: string;
};

const ShopAuthModal: React.FC<ShopAuthModalProps> = ({
  open,
  onOpenChange,
  shopId,
  shopName,
  employeeId,
  employeeName,
  position,
  multAuthEnabled,
  userId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(!multAuthEnabled);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const { loginToShop } = useShopSession();
  const updateMultAuthMutation = useUpdateMultAuth();
  const { generateSecretKey, storeSecretKey, getSecretKey, verifyToken, generateQRCodeUrl } = useTwoFactorAuth();

  const form = useForm<FormData>({
    defaultValues: {
      twoFactorCode: '',
      setupCode: '',
      confirmSetupCode: '',
    },
  });

  // Generate QR code when setup mode is activated
  React.useEffect(() => {
    if (isSetupMode && setupStep === 'qr' && !qrCodeDataUrl) {
      generateQRCode();
    }
  }, [isSetupMode, setupStep, qrCodeDataUrl]);

  const generateQRCode = async () => {
    try {
      // Generate a secret key for 2FA
      const secret = generateSecretKey();
      setSecretKey(secret);

      // Create the otpauth URL for QR code
      const otpauthUrl = generateQRCodeUrl(secret, shopName, employeeName);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (isSetupMode) {
      // Handle 2FA setup flow
      if (setupStep === 'qr') {
        // Generate QR code and proceed to verification step
        setSetupStep('verify');
        toast.success('2FA setup initiated. Please scan the QR code and enter the verification code.');
        return;
      } else if (setupStep === 'verify') {
        // Verify setup code
        if (!data.setupCode || data.setupCode.length !== 6) {
          toast.error('Please enter a valid 6-digit verification code');
          return;
        }

        if (data.setupCode !== data.confirmSetupCode) {
          toast.error('Verification codes do not match');
          return;
        }

        setIsLoading(true);
        try {
          console.log('2FA Setup Debug:', {
            setupCode: data.setupCode,
            secretKey: secretKey ? '***' : 'missing',
            employeeId,
            userId,
            shopId,
          });

          // Verify the TOTP code using the secret key
          const isValidCode = verifyToken(data.setupCode, secretKey);
          console.log('TOTP Verification Result:', isValidCode);
          
          if (!isValidCode) {
            toast.error('Invalid verification code. Please try again.');
            setIsLoading(false);
            return;
          }
          
          console.log('Storing secret key...');
          // Store the secret key for future authentication
          storeSecretKey(employeeId, shopId, secretKey);
          
          console.log('Updating database...');
          // Update user's multAuthEnabled status
          await updateMultAuthMutation.mutateAsync({
            employeeId: userId, // Use the UUID instead of employeeId
            multAuthEnabled: true,
          });
          
          console.log('2FA setup completed successfully');
          toast.success('2FA setup completed successfully!');
          setIsSetupMode(false);
          setSetupStep('qr');
          form.reset();
        } catch (error: any) {
          console.error('Error during 2FA setup:', error);
          console.error('Error details:', {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            name: error?.name,
          });
          toast.error(`Failed to complete 2FA setup: ${error?.message || 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    // Handle regular 2FA authentication
    if (!data.twoFactorCode || data.twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit 2FA code');
      return;
    }

    setIsLoading(true);

    try {
      // Get the stored secret key for this user and shop
      const storedSecretKey = getSecretKey(employeeId, shopId);
      
      if (!storedSecretKey) {
        toast.error('2FA not properly configured. Please contact administrator.');
        return;
      }

      // Verify the TOTP code using the stored secret key
      const isValidCode = verifyToken(data.twoFactorCode, storedSecretKey);

      if (isValidCode) {
        // Success - log into shop
        loginToShop(shopId, shopName, employeeId, employeeName, position);
        toast.success(`Successfully logged into ${shopName}`);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error('Invalid 2FA code. Please try again.');
      }
    } catch (error) {
      console.error('Error during 2FA verification:', error);
      toast.error('Failed to verify 2FA code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsSetupMode(!multAuthEnabled);
    setSetupStep('qr');
    onOpenChange(false);
  };

  const renderSetupContent = () => {
    if (setupStep === 'qr') {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-4">
            {qrCodeDataUrl ? (
              <div className="mx-auto w-48 h-48 bg-white rounded-lg p-4 border">
                <img 
                  src={qrCodeDataUrl} 
                  alt="2FA QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="mx-auto w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {secretKey && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Manual Entry Key:</p>
                <p className="text-xs font-mono bg-background p-2 rounded border break-all">
                  {secretKey}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Setup Instructions:</p>
              <ol className="text-sm text-muted-foreground space-y-1 text-left">
                <li>1. Download a 2FA app (Google Authenticator, Authy, etc.)</li>
                <li>2. Scan the QR code above or manually enter the key</li>
                <li>3. Enter the 6-digit code from your app</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="setupCode">Verification Code</Label>
          <Input
            id="setupCode"
            type="text"
            placeholder="Enter 6-digit code from your 2FA app"
            maxLength={6}
            {...form.register('setupCode', {
              required: 'Verification code is required',
              minLength: { value: 6, message: 'Code must be 6 digits' },
              maxLength: { value: 6, message: 'Code must be 6 digits' },
              pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
            })}
          />
          {form.formState.errors.setupCode && (
            <p className="text-sm text-destructive">
              {form.formState.errors.setupCode.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmSetupCode">Confirm Verification Code</Label>
          <Input
            id="confirmSetupCode"
            type="text"
            placeholder="Re-enter the 6-digit code"
            maxLength={6}
            {...form.register('confirmSetupCode', {
              required: 'Please confirm the verification code',
              minLength: { value: 6, message: 'Code must be 6 digits' },
              maxLength: { value: 6, message: 'Code must be 6 digits' },
              pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
            })}
          />
          {form.formState.errors.confirmSetupCode && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmSetupCode.message}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderAuthContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="twoFactorCode">Two-Factor Authentication Code</Label>
        <Input
          id="twoFactorCode"
          type="text"
          placeholder="Enter 6-digit code"
          maxLength={6}
          {...form.register('twoFactorCode', {
            required: '2FA code is required',
            minLength: { value: 6, message: 'Code must be 6 digits' },
            maxLength: { value: 6, message: 'Code must be 6 digits' },
            pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
          })}
        />
        {form.formState.errors.twoFactorCode && (
          <p className="text-sm text-destructive">
            {form.formState.errors.twoFactorCode.message}
          </p>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Store className="h-4 w-4" />
          <span className="font-medium">{shopName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>{employeeName} - {position}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Session will be valid for 24 hours</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {isSetupMode ? '2FA Setup Required' : 'Shop Authentication'}
          </DialogTitle>
          <DialogDescription>
            {isSetupMode 
              ? 'You need to set up two-factor authentication before accessing shop features.'
              : `Enter your 2FA code to access ${shopName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isSetupMode ? renderSetupContent() : renderAuthContent()}

          {isSetupMode && setupStep === 'qr' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span>2FA setup is required for security</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSetupMode ? 'Setting up...' : 'Verifying...'}
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {isSetupMode 
                    ? (setupStep === 'qr' ? 'Continue Setup' : 'Complete Setup')
                    : 'Verify & Login'
                  }
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShopAuthModal; 