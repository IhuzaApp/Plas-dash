import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { hasuraRequest } from '@/lib/hasura';
import bcrypt from 'bcryptjs';
import { Lock, User } from 'lucide-react';
import {
  GET_ORG_EMPLOYEE_BY_IDENTITY,
  GET_PROJECT_USER_BY_IDENTITY,
  GET_PROJECT_USER_BY_MEMBERSHIP_ID,
} from '@/lib/graphql/queries';
import {
  UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE,
  UPDATE_PROJECT_USER_LAST_LOGIN,
} from '@/lib/graphql/mutations';
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

const loginOrgEmployee = async (identity: string, password: string) => {
  const data = (await hasuraRequest(GET_ORG_EMPLOYEE_BY_IDENTITY, { identity })) as {
    orgEmployees: any[];
  };
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

// ProjectUser authentication function
const loginProjectUser = async (identity: string, password: string) => {
  let projectUsers: any[] = [];

  // First, try to find user by username or email
  try {
    const data = (await hasuraRequest(GET_PROJECT_USER_BY_IDENTITY, { identity })) as {
      ProjectUsers: any[];
    };
    projectUsers = data.ProjectUsers || [];
  } catch (error) {
    // String-based query failed, continue to integer-based query
  }

  // If no users found, try to find by MembershipId (if identity is a number)
  if (projectUsers.length === 0) {
    const membershipId = parseInt(identity);
    if (!isNaN(membershipId)) {
      try {
        const data = (await hasuraRequest(GET_PROJECT_USER_BY_MEMBERSHIP_ID, { membershipId })) as {
          ProjectUsers: any[];
        };
        projectUsers = data.ProjectUsers || [];
      } catch (error) {
        // Integer-based query failed
      }
    }
  }

  if (projectUsers && projectUsers.length > 0) {
    for (const user of projectUsers) {
      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password using the proper hashing method
      if (user.password) {
        const isValidPassword = await verifyProjectUserPassword(password, user.password);

        if (isValidPassword) {
          return user;
        }
      }
    }
  }

  throw new Error('Invalid credentials');
};

const updateLastLoginAndOnline = async (id: string) => {
  const last_login = new Date().toISOString();
  await hasuraRequest(UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE, { id, last_login, online: true });
};

// Update ProjectUser last login
const updateProjectUserLastLogin = async (id: string) => {
  try {
    const lastLogin = new Date().toISOString();
    await hasuraRequest(UPDATE_PROJECT_USER_LAST_LOGIN, { id, lastLogin });
  } catch (error) {
    // Don't throw error here, as login should still succeed even if last login update fails
  }
};

// Verify ProjectUser password (handles both bcrypt and custom SHA-256 formats)
const verifyProjectUserPassword = async (
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    // Check if it's a bcrypt hash (starts with $2b$)
    if (hashedPassword.startsWith('$2b$')) {
      return bcrypt.compareSync(inputPassword, hashedPassword);
    }

    // Check if it's our custom SHA-256 format (contains ':')
    if (hashedPassword.includes(':')) {
      // Parse the hashed password format: salt:hash
      const [saltHex, hash] = hashedPassword.split(':');

      if (!saltHex || !hash) {
        return false;
      }

      // Recreate the hashing process
      const passwordWithSalt = inputPassword + saltHex;
      let computedHash = passwordWithSalt;

      // Apply the same hashing iterations (10,000)
      for (let i = 0; i < 10000; i++) {
        const encoder = new TextEncoder();
        const data = encoder.encode(computedHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      return computedHash === hash;
    }

    // If it's neither format, try direct comparison (for legacy passwords)
    return inputPassword === hashedPassword;
  } catch (error) {
    return false;
  }
};

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const form = useForm<LoginFormInputs>({ defaultValues: { identifier: '', password: '' } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      let session: any;
      let isProjectUser = false;

      // Try to authenticate as OrgEmployee first
      try {
        session = await loginOrgEmployee(data.identifier, data.password);
        isProjectUser = false;
      } catch (orgError: any) {
        // If OrgEmployee login fails, try ProjectUser
        try {
          session = await loginProjectUser(data.identifier, data.password);
          isProjectUser = true;
        } catch (projectError: any) {
          // Both authentication methods failed
          throw new Error('Invalid credentials');
        }
      }

      // Update last login based on user type
      if (isProjectUser) {
        await updateProjectUserLastLogin(session.id);

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
        await updateLastLoginAndOnline(session.id);

        // Convert old privilege format to new fine-grained format
        const privileges = convertPrivilegesToNewFormat(session.orgEmployeeRoles);

        // Create session data with new privilege format
        const sessionData = {
          id: session.id,
          username: session.username,
          fullName: session.fullName,
          email: session.email,
          phoneNumber: session.phoneNumber,
          shop_id: session.shop_id,
          privileges: privileges,
          // Keep old format for backward compatibility
          orgEmployeeRoles: session.orgEmployeeRoles,
          isProjectUser: false,
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
