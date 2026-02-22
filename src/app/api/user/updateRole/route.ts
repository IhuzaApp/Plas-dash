import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const CHECK_SHOPPER_STATUS = gql`
  query CheckShopperStatus($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id }, active: { _eq: true } }) {
      id
      status
      active
    }
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: uuid!, $role: String!) {
    update_Users_by_pk(pk_columns: { id: $id }, _set: { role: $role }) {
      id
      role
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const body = await request.json();
  const { role } = body;
  if (!role || (role !== 'user' && role !== 'shopper')) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    if (role === 'shopper') {
      const { shoppers } = await hasuraClient.request<{
        shoppers: Array<{ id: string; status: string; active: boolean }>;
      }>(CHECK_SHOPPER_STATUS, { user_id: (session as any)?.user?.id });
      if (!shoppers?.length || !shoppers[0].active) {
        return NextResponse.json(
          {
            error: 'User is not an active shopper',
            code: 'NOT_ACTIVE_SHOPPER',
          },
          { status: 403 }
        );
      }
    }
    const response = await hasuraClient.request<{
      update_Users_by_pk: { id: string; role: string } | null;
    }>(UPDATE_USER_ROLE, {
      id: (session as any)?.user?.id,
      role,
    });
    if (!response.update_Users_by_pk) {
      throw new Error('Failed to update user role');
    }
    return NextResponse.json({
      success: true,
      role,
      redirectTo: '/',
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      {
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
