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
} from '@/lib/graphql/mutations';

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

    // 1. Try OrgEmployee
    const orgData = await hasuraClient.request<{ orgEmployees: any[] }>(
      GET_ORG_EMPLOYEE_BY_IDENTITY,
      { identity: identifier }
    );

    if (orgData.orgEmployees?.[0]) {
      const emp = orgData.orgEmployees[0];
      if (emp.password && verifyOrgEmployeePassword(password, emp.password)) {
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
        if (!user.is_active) continue;
        if (user.password && (await verifyProjectUserPassword(password, user.password))) {
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
        }
      }
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
