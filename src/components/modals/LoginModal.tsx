import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { Lock, User } from 'lucide-react';
import { UserPrivileges, DEFAULT_PRIVILEGES } from '@/types/privileges';
import { convertCustomPermissionsToPrivileges } from '@/lib/privileges/privilegeConverters';

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

  return (
    <Dialog open>
      <DialogContent className="max-w-md w-[90%] rounded-[2rem] shadow-2xl border-none p-0 overflow-hidden bg-transparent">
        <div className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-10 flex flex-col items-center">
          {/* Background Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="z-10 w-full">
            <DialogHeader className="mb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 shadow-inner group transition-all duration-500 hover:scale-110">
                  <img
                    src="/Assets/logo/Plas Icon.png"
                    alt="Plas Logo"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="text-center">
                  <DialogTitle className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                    Welcome Back
                  </DialogTitle>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    Access the Plas Admin ecosystem
                  </p>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                        Login Identity
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <Input
                            {...field}
                            className="h-14 pl-12 pr-4 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl transition-all duration-300 font-medium"
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
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                          Secure Password
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <Input
                            {...field}
                            type="password"
                            className="h-14 pl-12 pr-4 bg-zinc-100/50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl transition-all duration-300 font-medium"
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
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-xl text-center animate-shake">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-14 mt-4 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span>Authenticating...</span>
                    </div>
                  ) : 'Sign In to Dashboard'}
                </Button>
              </form>
            </Form>
            
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
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
