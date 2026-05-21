import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const UPDATE_EMPLOYEE_POS_PIN = gql`
  mutation UpdateEmployeePosPin($id: uuid!, $pos_pin: String!) {
    update_orgEmployees_by_pk(pk_columns: { id: $id }, _set: { pos_pin: $pos_pin }) {
      id
      pos_pin
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
    console.warn('[Update Employee PIN] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, pos_pin } = body;

    if (!id || pos_pin === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request(UPDATE_EMPLOYEE_POS_PIN, {
      id,
      pos_pin,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating employee POS PIN:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update employee PIN' },
      { status: 500 }
    );
  }
}
