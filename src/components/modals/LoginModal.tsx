import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import { UserPrivileges, DEFAULT_PRIVILEGES } from '@/types/privileges';
import { convertCustomPermissionsToPrivileges } from '@/lib/privileges/privilegeConverters';
import { cn } from '@/lib/utils';

interface LoginModalProps {
  onLoginSuccess: (sessionData: any) => void;
}

type LoginFormInputs = {
  identifier: string;
  password: string;
};

// Convert old privilege format to new fine-grained format
const convertPrivilegesToNewFormat = (orgEmployeeRoles: any): UserPrivileges => {
  if (!orgEmployeeRoles) return { ...DEFAULT_PRIVILEGES };

  let oldPrivileges: any = [];

  // Extract privileges from orgEmployeeRoles
  if (Array.isArray(orgEmployeeRoles)) {
    oldPrivileges = orgEmployeeRoles[0]?.privillages || [];
  } else if (orgEmployeeRoles.privillages) {
    oldPrivileges = orgEmployeeRoles.privillages;
  }

  // If it's already an object (new format), merge it with defaults
  if (typeof oldPrivileges === 'object' && !Array.isArray(oldPrivileges)) {
    return { ...DEFAULT_PRIVILEGES, ...oldPrivileges };
  }

  // Use the shared converter for legacy array format
  return {
    ...DEFAULT_PRIVILEGES,
    ...convertCustomPermissionsToPrivileges(oldPrivileges as string[]),
  };
};

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const form = useForm<LoginFormInputs>({ defaultValues: { identifier: '', password: '' } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      console.log('DEBUG: Sending login request to API');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('DEBUG: Login API failed:', errorData.error);
        throw new Error(errorData.error || 'Login failed');
      }

      const { user: session, isProjectUser } = await response.json();
      console.log('DEBUG: Login API success, type:', isProjectUser ? 'ProjectUser' : 'OrgEmployee');

      // Update session data based on user type
      if (isProjectUser) {
        // Create session data for ProjectUser
        const sessionData = {
          id: session.id,
          username: session.username,
          email: session.email,
          role: session.role,
          is_active: session.is_active,
          TwoAuth_enabled: session.TwoAuth_enabled,
          profile: session.profile,
          privileges: session.privileges || {},
          isProjectUser: true,
          // For backward compatibility
          fullName: session.username,
          phoneNumber: '',
          shop_id: null,
          orgEmployeeRoles: null,
        };

        onLoginSuccess(sessionData);
      } else {
        // OrgEmployee authentication
        // Convert old privilege format to new fine-grained format
        const privileges = convertPrivilegesToNewFormat(session.orgEmployeeRoles);

        // Create session data with new privilege format
        const sessionData = {
          id: session.id,
          username: session.fullnames || session.username,
          fullName: session.fullnames || session.fullName,
          email: session.email,
          phoneNumber: session.phone || session.phoneNumber,
          shop_id: session.shop_id,
          privileges: privileges,
          // Keep old format for backward compatibility
          orgEmployeeRoles: session.orgEmployeeRoles,
          isProjectUser: false,
          role: session.roleType,
        };

        onLoginSuccess(sessionData);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const [showHelp, setShowHelp] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportData, setSupportData] = useState({
    email: '',
    sharedId: '',
    description: '',
  });

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    setSupportError(null);
    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportData),
      });

      const result = await response.json();

      if (response.ok) {
        setSupportSuccess(true);
        setTimeout(() => {
          setShowHelp(false);
          setSupportSuccess(false);
          setSupportData({ email: '', sharedId: '', description: '' });
        }, 3000);
      } else {
        setSupportError(result.error || 'Failed to verify account.');
      }
    } catch (err) {
      setSupportError('A connection error occurred.');
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-md w-[90%] rounded-[2rem] shadow-2xl border-none p-0 overflow-hidden bg-transparent">
        <div className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-8 flex flex-col items-center">
          {/* Background Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />

          <div className="z-10 w-full">
            <DialogHeader className="mb-6">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group transition-all duration-500 hover:scale-110">
                  <img
                    src="/Assets/logo/Plas Icon.png"
                    alt="Plas Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="text-center">
                  <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                    {showHelp ? 'Help & Support' : 'Welcome Back'}
                  </DialogTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    {showHelp
                      ? 'Verify your account to raise a support ticket.'
                      : 'Access the Plas Admin ecosystem'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {!showHelp ? (
              <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                            Login Identity
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors w-4 h-4" />
                              <Input
                                {...field}
                                className="h-12 pl-11 pr-4 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-zinc-200/50 dark:border-zinc-700/50 focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-xl transition-all duration-300 text-sm font-medium"
                                placeholder="Email or Username"
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between ml-1">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                              Secure Password
                            </FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors w-4 h-4" />
                              <Input
                                {...field}
                                type="password"
                                className="h-12 pl-11 pr-4 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-zinc-200/50 dark:border-zinc-700/50 focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-xl transition-all duration-300 text-sm font-medium"
                                placeholder="••••••••"
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold p-2.5 rounded-xl text-center animate-shake">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 mt-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Authenticating...</span>
                        </div>
                      ) : 'Sign In'}
                    </Button>
                  </form>
                </Form>

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(true)}
                    className="text-[10px] font-bold text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg uppercase tracking-wider"
                  >
                    Can't sign in? Get Help
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {supportSuccess ? (
                  <div className="py-8 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-bounce">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Request Raised!</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Account verified. Our team is investigating your issue.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                          Account Email
                        </label>
                        <Input
                          required
                          type="email"
                          value={supportData.email}
                          onChange={(e) => setSupportData({ ...supportData, email: e.target.value })}
                          className="h-11 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-zinc-200/50 dark:border-zinc-700/50 focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-xl text-sm font-medium transition-all duration-300"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                          Employee ID / Membership ID
                        </label>
                        <Input
                          required
                          value={supportData.sharedId}
                          onChange={(e) => setSupportData({ ...supportData, sharedId: e.target.value })}
                          className="h-11 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-zinc-200/50 dark:border-zinc-700/50 focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-xl text-sm font-medium transition-all duration-300"
                          placeholder="Enter your assigned ID"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                          Issue Description
                        </label>
                        <textarea
                          required
                          value={supportData.description}
                          onChange={(e) => setSupportData({ ...supportData, description: e.target.value })}
                          className="w-full h-24 p-3 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-zinc-200/50 dark:border-zinc-700/50 focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-xl text-sm font-medium resize-none outline-none transition-all duration-300"
                          placeholder="Briefly describe the login error..."
                        />
                      </div>
                    </div>

                    {supportError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold p-2.5 rounded-xl text-center">
                        {supportError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowHelp(false)}
                        className="flex-1 h-12 rounded-xl text-sm font-bold"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={supportLoading}
                        className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                      >
                        {supportLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : 'Verify & Submit'}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            )}

            <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Powered by Plas Intelligence
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
