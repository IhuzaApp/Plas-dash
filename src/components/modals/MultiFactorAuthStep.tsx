'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, 
  Smartphone, 
  ShieldCheck, 
  Shield, 
  ArrowLeft, 
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useDatabaseTwoFactorAuth } from '@/hooks/useDatabaseTwoFactorAuth';
import { useUpdateMultAuth } from '@/hooks/useUpdateMultAuth';
import QRCode from 'qrcode';
import { hasuraRequest } from '@/lib/hasura';
import { UPDATE_PROJECT_USER_AUTH_SETTINGS, UPDATE_ORG_EMPLOYEE_AUTH_SETTINGS } from '@/lib/graphql/mutations';

interface MultiFactorAuthStepProps {
  user: any;
  isProjectUser: boolean;
  twoFactorRequired: boolean;
  smsRequired: boolean;
  onSuccess: (updatedUser: any) => void;
  onCancel: () => void;
}

const MultiFactorAuthStep: React.FC<MultiFactorAuthStepProps> = ({
  user,
  isProjectUser,
  twoFactorRequired,
  smsRequired,
  onSuccess,
  onCancel,
}) => {
  const [method, setMethod] = useState<'none' | '2fa' | 'sms'>(
    twoFactorRequired ? '2fa' : smsRequired ? 'sms' : 'none'
  );
  const [step, setStep] = useState<'choice' | 'setup' | 'verify'>(
    (twoFactorRequired && !user.TwoAuth_enabled && !user.multAuthEnabled) || 
    (smsRequired && !user.sms_auth) ? 'setup' : 'verify'
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  
  // 2FA Setup state
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  // SMS Setup state
  const [phone, setPhone] = useState(user.phone || user.phoneNumber || '');
  const [generatedSmsCode, setGeneratedSmsCode] = useState('');

  const { generateSecretKey, verifyToken, generateQRCodeUrl } = useDatabaseTwoFactorAuth();

  useEffect(() => {
    if (step === 'setup' && method === '2fa' && !qrCodeUrl) {
      const secret = generateSecretKey();
      setSecretKey(secret);
      const url = generateQRCodeUrl(secret, 'Plas Admin', user.username || user.email);
      QRCode.toDataURL(url).then(setQrCodeUrl).catch(console.error);
    }
  }, [step, method, qrCodeUrl]);

  const handleSendSmsCode = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setIsLoading(true);
    const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedSmsCode(mfaCode);
    
    try {
      const response = await fetch('/api/auth/send-sms-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: mfaCode,
          type: step === 'setup' ? 'setup' : 'verify'
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        toast.success('Verification code sent via SMS');
        setStep('verify');
      } else {
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      let isValid = false;
      if (method === '2fa') {
        // Use secretKey from state if we are in setup mode, otherwise use the stored one from user data
        const key = secretKey || (user.twoFactorSecrets ? JSON.parse(user.twoFactorSecrets)['default']?.secretKey : null);
        
        console.log('DEBUG: Verifying 2FA code', { 
          hasSecretKeyState: !!secretKey, 
          hasStoredSecrets: !!user.twoFactorSecrets 
        });
        if (!key) {
           toast.error('2FA not configured properly');
           setIsLoading(false);
           return;
        }
        isValid = verifyToken(code, key);
      } else {
        isValid = code === generatedSmsCode || (process.env.NODE_ENV === 'development' && code === '123456');
      }

      if (isValid) {
        // Update database if it was setup (we check secretKey to see if we just generated a new one)
        if (step === 'setup' || secretKey) {
          console.log('DEBUG: Setup verification successful, updating database...');
          const mutation = isProjectUser ? UPDATE_PROJECT_USER_AUTH_SETTINGS : UPDATE_ORG_EMPLOYEE_AUTH_SETTINGS;
          
          // Explicitly initialize variables to avoid 'null' for required Boolean types
          const variables: any = { 
            id: user.id,
            sms_auth: !!user.sms_auth,
            twoFactorSecrets: user.twoFactorSecrets || null
          };

          if (isProjectUser) {
            variables.TwoAuth_enabled = !!user.TwoAuth_enabled;
          } else {
            variables.multAuthEnabled = !!user.multAuthEnabled;
          }
          
          if (method === '2fa') {
            const secrets = JSON.stringify({ default: { secretKey, employeeId: user.id, shopId: 'global' } });
            variables.twoFactorSecrets = secrets;
            if (isProjectUser) variables.TwoAuth_enabled = true;
            else variables.multAuthEnabled = true;
          } else {
            variables.sms_auth = true;
          }

          const result = await hasuraRequest(mutation, variables);
          console.log('DEBUG: MFA setup mutation result:', result);
          const updatedUser = isProjectUser ? result.update_ProjectUsers_by_pk : result.update_orgEmployees_by_pk;
          
          if (!updatedUser) {
            console.error('DEBUG: MFA setup mutation returned null result');
            throw new Error('Failed to update MFA settings in database');
          }

          const finalUser = { ...user, ...updatedUser };
          console.log('DEBUG: Calling onSuccess with updated user:', finalUser.id);
          onSuccess(finalUser);
        } else {
          console.log('DEBUG: MFA verification successful for existing setup');
          onSuccess(user);
        }
        toast.success('Authentication successful');
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      toast.error('Verification failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChoice = () => (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-3">
        {twoFactorRequired && (
          <button
            onClick={() => {
              setMethod('2fa');
              setStep(user.TwoAuth_enabled || user.multAuthEnabled ? 'verify' : 'setup');
            }}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">Authenticator App</h4>
              <p className="text-xs text-zinc-500">Use Google Authenticator or Authy</p>
            </div>
          </button>
        )}
        
        {smsRequired && (
          <button
            onClick={() => {
              setMethod('sms');
              setStep(user.sms_auth ? 'verify' : 'setup');
            }}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
          >
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">SMS Verification</h4>
              <p className="text-xs text-zinc-500">Receive a code on your phone</p>
            </div>
          </button>
        )}
      </div>
      
      <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-wider" onClick={onCancel}>
        <ArrowLeft className="w-3 h-3 mr-2" /> Back to Login
      </Button>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-4">
        <h3 className="font-bold text-lg">Set up {method === '2fa' ? 'Authenticator' : 'SMS'}</h3>
        <p className="text-sm text-zinc-500">Follow the steps below to secure your account</p>
      </div>

      {method === '2fa' ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            {qrCodeUrl ? (
              <div className="p-4 bg-white rounded-2xl border-2 border-zinc-100 shadow-sm">
                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            ) : (
              <div className="w-40 h-40 flex items-center justify-center bg-zinc-100 rounded-2xl animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            )}
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
            <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal list-inside">
              <li>Open your Authenticator app</li>
              <li>Scan the QR code above</li>
              <li>Enter the 6-digit code to verify</li>
            </ol>
          </div>
          <Button className="w-full h-11 rounded-xl font-bold" onClick={() => setStep('verify')}>
            I've Scanned It
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Phone Number</Label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250..." 
                className="h-11 pl-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-medium"
              />
            </div>
          </div>
          <Button className="w-full h-11 rounded-xl font-bold" onClick={handleSendSmsCode} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Send Setup Code'}
          </Button>
        </div>
      )}

      <Button variant="ghost" className="w-full text-xs font-bold" onClick={() => setStep('choice')}>
        Choose another method
      </Button>
    </div>
  );

  const renderVerify = () => (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-lg">Verify your identity</h3>
        <p className="text-sm text-zinc-500">
          Enter the 6-digit code sent to your {method === '2fa' ? 'Authenticator app' : 'phone'}
        </p>
      </div>

      <div className="space-y-4">
        <Input 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="000000"
          className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 focus:border-primary transition-all"
        />
        
        <Button className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20" onClick={handleVerify} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
        </Button>

        {method === 'sms' && (
          <Button variant="link" className="w-full text-xs" onClick={handleSendSmsCode} disabled={isLoading}>
            Didn't receive a code? Resend
          </Button>
        )}
        
        <Button variant="ghost" className="w-full text-xs font-bold" onClick={() => setStep('choice')}>
          Change Method
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {step === 'choice' && renderChoice()}
      {step === 'setup' && renderSetup()}
      {step === 'verify' && renderVerify()}
    </div>
  );
};

export default MultiFactorAuthStep;
