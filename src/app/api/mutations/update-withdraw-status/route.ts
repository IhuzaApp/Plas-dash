import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const UPDATE_WITHDRAW_STATUS = gql`
  mutation UpdateWithdrawStatus($id: uuid!, $status: String!, $update_at: timestamptz!) {
    update_withDraweRequest_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, update_at: $update_at }
    ) {
      id
      status
      update_at
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 });
    }

    const allowed = ['approved', 'rejected'];
    if (!allowed.includes(String(status).toLowerCase())) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
    }

    const result = await hasuraClient.request<{
      update_withDraweRequest_by_pk: { id: string; status: string; update_at: string } | null;
    }>(UPDATE_WITHDRAW_STATUS, {
      id,
      status: String(status).toLowerCase(),
      update_at: new Date().toISOString(),
    });

    if (!result.update_withDraweRequest_by_pk) {
      return NextResponse.json(
        { error: 'Withdraw request not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      withdraw: result.update_withDraweRequest_by_pk,
    });
  } catch (error: unknown) {
    console.error('Error updating withdraw status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update withdraw status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
