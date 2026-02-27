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
  return { ...DEFAULT_PRIVILEGES, ...convertCustomPermissionsToPrivileges(oldPrivileges as string[]) };
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
      <DialogContent className="max-w-md rounded-2xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
        <div className="bg-white dark:bg-zinc-900/90 p-8 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2 text-center">
              Org Employee Login
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Username / Full Name / Email / Number
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <Input
                          {...field}
                          className="pl-10 bg-zinc-100 dark:bg-zinc-800/60 border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-zinc-900/90 transition"
                          placeholder="Enter your identifier"
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
                    <FormLabel className="font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <Input
                          {...field}
                          type="password"
                          className="pl-10 bg-zinc-100 dark:bg-zinc-800/60 border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-zinc-900/90 transition"
                          placeholder="Enter your password"
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
