import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { hasuraRequest } from '@/lib/hasura';
import bcrypt from 'bcryptjs';
import { Lock, User } from 'lucide-react';
import { GET_ORG_EMPLOYEE_BY_IDENTITY } from '@/lib/graphql/queries';
import { UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE } from '@/lib/graphql/mutations';

interface LoginModalProps {
  onLoginSuccess: (sessionData: any) => void;
}

type LoginFormInputs = {
  identifier: string;
  password: string;
};

const loginOrgEmployee = async (identity: string, password: string) => {
  const data = await hasuraRequest(GET_ORG_EMPLOYEE_BY_IDENTITY, { identity }) as { orgEmployees: any[] };
  const employees = data.orgEmployees;
  if (employees && employees.length > 0) {
    for (const emp of employees) {
      if (emp.password && bcrypt.compareSync(password, emp.password)) {
        return emp;
      }
    }
  }
  throw new Error('Invalid credentials');
};

const updateLastLoginAndOnline = async (id: string) => {
  const last_login = new Date().toISOString();
  await hasuraRequest(UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE, { id, last_login, online: true });
};

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const form = useForm<LoginFormInputs>({ defaultValues: { identifier: '', password: '' } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      const session = await loginOrgEmployee(data.identifier, data.password);
      await updateLastLoginAndOnline(session.id);
      // Save orgEmployeeRoles in session for sidebar privilege filtering
      onLoginSuccess({ ...session, orgEmployeeRoles: session.orgEmployeeRoles });
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
            <DialogTitle className="text-2xl font-bold mb-2 text-center">Org Employee Login</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Username / Full Name / Email / Number</FormLabel>
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