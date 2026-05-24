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
  const { activeBusiness, isBusinessLoading } = useShopSession();
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

      // Check for MFA requirements - only required for project users
      const twoFactorRequired = isProjectUser
        ? !!(
            session.privileges?.twoFactorRequired ||
            session.TwoAuth_enabled ||
            session.multAuthEnabled
          )
        : false;
      const smsRequired = isProjectUser ? !!session.sms_auth : false;
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
        restaurant_id: null,
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
        restaurant_id: session.restaurant_id,
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

  // Block render until the business context has fully resolved so we always
  // show the correct shop / restaurant / project-user identity in the header.
  if (isBusinessLoading) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden">
        {/* Full-bleed hero background */}
        <img
          src="/Assets/plas-agents-hero.png"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay so spinner is readable */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/40" />

        {/* Spinner + logo centered over the image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-7">
          {/* Spinner ring with logo perfectly centered */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-white/15 border-t-primary animate-spin" />
            <div
              className="absolute inset-2 rounded-full border-[2px] border-white/8 border-b-primary/60 animate-spin"
              style={{ animationDuration: '2s', animationDirection: 'reverse' }}
            />
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl">
              <img src="/Assets/logo/Plas Icon.png" alt="Plas" className="w-9 h-9 object-contain" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-black tracking-[0.25em] text-white uppercase drop-shadow">
              PLAS
            </h2>
            <p className="text-[10px] font-semibold text-white/70 uppercase tracking-[0.4em]">
              Loading Portal…
            </p>
          </div>

          {/* Slim animated progress bar */}
          <div className="w-40 h-[2px] rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ animation: 'plasLoadingBar 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>

        <style>{`
          @keyframes plasLoadingBar {
            0%   { width: 0%;   transform: translateX(0%); }
            50%  { width: 55%;  }
            100% { width: 0%;   transform: translateX(800%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen hero backdrop that sits behind the dialog */}
      <div className="fixed inset-0 z-40 overflow-hidden">
        <img
          src="/Assets/plas-agents-hero.png"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/35 backdrop-blur-[2px]" />
      </div>

      <Dialog open={true}>
        <DialogContent
          className={cn(
            'sm:max-w-[440px] p-8 border border-white/10 bg-background/75 backdrop-blur-2xl shadow-2xl rounded-[2rem] overflow-hidden transition-all duration-500 z-50',
            authStep === 'mfa' ? 'sm:max-w-[480px]' : ''
          )}
          onPointerDownOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <div className="relative z-10">
            {authStep === 'mfa' ? (
              <MultiFactorAuthStep
                user={mfaUser.session}
                isProjectUser={mfaUser.isProjectUser}
                twoFactorRequired={mfaUser.twoFactorRequired}
                smsRequired={mfaUser.smsRequired}
                onSuccess={updatedSession => {
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

                {!showHelp ? <LoginForm form={form} onSubmit={onSubmit} loading={loading} /> : null}

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

          {/* Subtle inner glow blobs */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-56 h-56 bg-primary/20 rounded-full blur-[70px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-56 h-56 bg-primary/10 rounded-full blur-[70px] animate-pulse delay-700" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
