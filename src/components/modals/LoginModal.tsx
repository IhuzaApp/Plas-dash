import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { usePageLoading } from '@/hooks/usePageLoading';
import MultiFactorAuthStep from './MultiFactorAuthStep';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { normalizeUserPrivileges } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// New Sub-components
import LoginHeader from '../auth/login/LoginHeader';
import LoginForm from '../auth/login/LoginForm';
import LoginSupport from '../auth/login/LoginSupport';

interface LoginModalProps {
  onLoginSuccess: (sessionData: any) => void;
}

type LoginFormInputs = {
  identifier: string;
  password: string;
};

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const { activeBusiness } = useShopSession();
  const form = useForm<LoginFormInputs>({ defaultValues: { identifier: '', password: '' } });
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'mfa'>('login');
  const [mfaUser, setMfaUser] = useState<any>(null);
  const { startLoading } = usePageLoading();

  // Support section state
  const [showHelp, setShowHelp] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportData, setSupportData] = useState({
    email: '',
    sharedId: '',
    description: '',
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    try {
      console.log('DEBUG: Sending login request to API');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { user: session, isProjectUser } = await response.json();
      console.log('DEBUG: Login API success, type:', isProjectUser ? 'ProjectUser' : 'OrgEmployee');

      // Enforce business subdomain restrictions
      if (activeBusiness) {
        if (isProjectUser) {
          form.setError('identifier', {
            type: 'manual',
            message: 'User not found in the organizations',
          });
          setLoading(false);
          return;
        }
        
        const userBusinessId = session.shop_id || session.restaurant_id;
        if (userBusinessId !== activeBusiness.id) {
          throw new Error(`Access denied: You are not authorized to access ${activeBusiness.name}`);
        }
      }

      // Check for MFA requirements
      const twoFactorRequired = !!(session.privileges?.twoFactorRequired || session.TwoAuth_enabled || session.multAuthEnabled);
      const smsRequired = !!(session.privileges?.smsAuthRequired || session.sms_auth);

      if (twoFactorRequired || smsRequired) {
        setMfaUser({ session, isProjectUser, twoFactorRequired, smsRequired });
        setAuthStep('mfa');
        setLoading(false);
        return;
      }

      startLoading();
      completeLogin(session, isProjectUser);
    } catch (error: any) {
      console.error('DEBUG: Login API failed:', error.message);
      form.setError('identifier', { type: 'manual', message: error.message });
      setLoading(false);
    }
  };

  const completeLogin = (session: any, isProjectUser: boolean) => {
    let sessionData: any;

    if (isProjectUser) {
      sessionData = {
        id: session.id,
        username: session.username,
        email: session.email,
        role: session.role,
        is_active: session.is_active,
        privileges: session.privileges || {},
        isProjectUser: true,
        fullName: session.username,
        phoneNumber: session.phone || '',
        shop_id: null,
        orgEmployeeRoles: null,
      };
    } else {
      const privileges = normalizeUserPrivileges(session.orgEmployeeRoles);
      sessionData = {
        id: session.id,
        username: session.fullnames || session.username,
        fullName: session.fullnames || session.fullName,
        email: session.email,
        phoneNumber: session.phone || session.phoneNumber,
        shop_id: session.shop_id,
        shop_name: session.Shops?.[0]?.name,
        restaurant_name: session.Restaurants?.[0]?.name,
        privileges: privileges,
        orgEmployeeRoles: session.orgEmployeeRoles,
        isProjectUser: false,
        role: session.roleType,
      };
    }

    onLoginSuccess(sessionData);
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    setSupportError(null);
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportData),
      });
      if (!res.ok) throw new Error('Failed to submit ticket');
      setSupportSuccess(true);
    } catch (err: any) {
      setSupportError(err.message);
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className={cn(
          "sm:max-w-[440px] p-8 border-none bg-background/80 backdrop-blur-2xl shadow-2xl rounded-[2rem] overflow-hidden transition-all duration-500",
          authStep === 'mfa' ? "sm:max-w-[480px]" : ""
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative z-10">
          {authStep === 'mfa' ? (
            <MultiFactorAuthStep
              user={mfaUser.session}
              isProjectUser={mfaUser.isProjectUser}
              twoFactorRequired={mfaUser.twoFactorRequired}
              smsRequired={mfaUser.smsRequired}
              onSuccess={(updatedSession) => {
                startLoading();
                completeLogin(updatedSession, mfaUser.isProjectUser);
              }}
              onCancel={() => setAuthStep('login')}
            />
          ) : (
            <>
              <LoginHeader 
                businessName={activeBusiness?.name} 
                businessLogo={activeBusiness?.logo} 
              />
              
              {!showHelp ? (
                <LoginForm 
                  form={form} 
                  onSubmit={onSubmit} 
                  loading={loading} 
                />
              ) : null}

              <LoginSupport
                showHelp={showHelp}
                setShowHelp={setShowHelp}
                supportData={supportData}
                setSupportData={setSupportData}
                onSubmitSupport={handleSubmitSupport}
                loading={supportLoading}
                success={supportSuccess}
                error={supportError}
              />
            </>
          )}
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse delay-700" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
