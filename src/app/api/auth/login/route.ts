import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import bcrypt from 'bcryptjs';
import {
  GET_ORG_EMPLOYEE_BY_IDENTITY,
  GET_PROJECT_USER_BY_IDENTITY,
  GET_PROJECT_USER_BY_MEMBERSHIP_ID,
} from '@/lib/graphql/queries';
import {
  UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE,
  UPDATE_PROJECT_USER_LAST_LOGIN,
  DEACTIVATE_PROJECT_USER,
  DEACTIVATE_ORG_EMPLOYEE,
} from '@/lib/graphql/mutations';

// In-memory store for failed attempts (Resets on server restart)
const failedAttemptsMap = new Map<string, number>();
const MAX_ATTEMPTS = 3;

const verifyOrgEmployeePassword = (inputPassword: string, hashedPassword: string): boolean => {
  try {
    if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
      return bcrypt.compareSync(inputPassword, hashedPassword);
    }
    return inputPassword === hashedPassword;
  } catch (error) {
    return false;
  }
};

const verifyProjectUserPassword = async (
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    if (hashedPassword.startsWith('$2b$')) {
      return bcrypt.compareSync(inputPassword, hashedPassword);
    }

    if (hashedPassword.includes(':')) {
      const [saltHex, hash] = hashedPassword.split(':');
      if (!saltHex || !hash) return false;

      const passwordWithSalt = inputPassword + saltHex;
      let computedHash = passwordWithSalt;

      for (let i = 0; i < 10000; i++) {
        const encoder = new TextEncoder();
        const data = encoder.encode(computedHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      return computedHash === hash;
    }

    return inputPassword === hashedPassword;
  } catch (error) {
    return false;
  }
};

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifier and password are required' }, { status: 400 });
    }

    if (!hasuraClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const attempts = failedAttemptsMap.get(identifier) || 0;

    // 1. Try OrgEmployee
    const orgData = await hasuraClient.request<{ orgEmployees: any[] }>(
      GET_ORG_EMPLOYEE_BY_IDENTITY,
      { identity: identifier }
    );

    if (orgData.orgEmployees?.[0]) {
      const emp = orgData.orgEmployees[0];

      if (!emp.active) {
        return NextResponse.json(
          {
            error:
              'Your account is deactivated. Please contact IT support to reactivate your account.',
          },
          { status: 403 }
        );
      }

      if (emp.password && verifyOrgEmployeePassword(password, emp.password)) {
        // Success: reset attempts
        failedAttemptsMap.delete(identifier);

        // Update last login and online status
        try {
          await hasuraClient.request(UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE, {
            id: emp.id,
            last_login: now,
            online: true,
          });
        } catch (e) {
          console.error('Failed to update employee last login:', e);
        }

        const { password: _, ...employeeWithoutPassword } = emp;
        return NextResponse.json({
          user: employeeWithoutPassword,
          isProjectUser: false,
        });
      } else {
        // Failed attempt for this user
        const newAttempts = attempts + 1;
        failedAttemptsMap.set(identifier, newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          await hasuraClient.request(DEACTIVATE_ORG_EMPLOYEE, { id: emp.id });
          return NextResponse.json(
            {
              error:
                'Security Alert: Account deactivated due to multiple failed login attempts. Please contact IT support to reactivate your account.',
            },
            { status: 403 }
          );
        }
      }
    }

    // 2. Try ProjectUser
    let projectUsers: any[] = [];
    try {
      const pData = await hasuraClient.request<{ ProjectUsers: any[] }>(
        GET_PROJECT_USER_BY_IDENTITY,
        { identity: identifier }
      );
      projectUsers = pData.ProjectUsers || [];
    } catch (e) {
      // Ignore
    }

    if (projectUsers.length === 0) {
      const membershipId = parseInt(identifier);
      if (!isNaN(membershipId)) {
        try {
          const pData = await hasuraClient.request<{ ProjectUsers: any[] }>(
            GET_PROJECT_USER_BY_MEMBERSHIP_ID,
            { membershipId }
          );
          projectUsers = pData.ProjectUsers || [];
        } catch (e) {
          // Ignore
        }
      }
    }

    if (projectUsers.length > 0) {
      for (const user of projectUsers) {
        if (!user.is_active) {
          return NextResponse.json(
            {
              error:
                'Your account is deactivated. Please contact IT support to reactivate your account.',
            },
            { status: 403 }
          );
        }

        if (user.password && (await verifyProjectUserPassword(password, user.password))) {
          // Success: reset attempts
          failedAttemptsMap.delete(identifier);

          // Update last login
          try {
            await hasuraClient.request(UPDATE_PROJECT_USER_LAST_LOGIN, {
              id: user.id,
              lastLogin: now,
            });
          } catch (e) {
            console.error('Failed to update project user last login:', e);
          }

          const { password: _, ...userWithoutPassword } = user;
          return NextResponse.json({
            user: userWithoutPassword,
            isProjectUser: true,
          });
        } else {
          // Failed attempt for this user
          const newAttempts = attempts + 1;
          failedAttemptsMap.set(identifier, newAttempts);

          if (newAttempts >= MAX_ATTEMPTS) {
            await hasuraClient.request(DEACTIVATE_PROJECT_USER, { id: user.id });
            return NextResponse.json(
              {
                error:
                  'Security Alert: Account deactivated due to multiple failed login attempts. Please contact IT support to reactivate your account.',
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // If we reach here, either the user doesn't exist or we haven't hit the 3 attempts yet for a non-existent/incorrect combo
    // We should still increment attempts for unknown identifiers to prevent brute force
    failedAttemptsMap.set(identifier, attempts + 1);

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
