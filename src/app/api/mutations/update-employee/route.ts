import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const UPDATE_EMPLOYEE_ROLE_TYPE = gql`
  mutation UpdateEmployeeRoleType($id: uuid!, $roleType: String!) {
    update_orgEmployees(where: { id: { _eq: $id } }, _set: { roleType: $roleType }) {
      affected_rows
    }
  }
`;

const UPDATE_EMPLOYEE_PRIVILEGES = gql`
  mutation UpdateEmployeePrivileges($id: uuid!, $privillages: jsonb!, $update_on: timestamptz!) {
    update_orgEmployeeRoles(
      where: { orgEmployeeID: { _eq: $id } }
      _set: { privillages: $privillages, update_on: $update_on }
    ) {
      affected_rows
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) {
    console.warn('[Update Employee] Unauthorized access attempt - no session or bearer token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, roleType, privileges } = body;

    if (!id || !roleType || !privileges) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    // Update both tables
    const results = await Promise.all([
      hasuraClient.request(UPDATE_EMPLOYEE_ROLE_TYPE, {
        id,
        roleType: roleType || 'custom',
      }),
      hasuraClient.request(UPDATE_EMPLOYEE_PRIVILEGES, {
        id,
        privillages: privileges,
        update_on: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({
      success: true,
      affected_rows: results.reduce(
        (acc, res: any) =>
          acc +
          (res.update_orgEmployees?.affected_rows ||
            res.update_orgEmployeeRoles?.affected_rows ||
            0),
        0
      ),
    });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update employee',
      },
      { status: 500 }
    );
  }
}
