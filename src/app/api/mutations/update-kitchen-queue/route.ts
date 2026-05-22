import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const UPDATE_KITCHEN_QUEUE = gql`
  mutation UpdateKitchenQueue($token_number: String!, $status: String!, $updated_at: timestamptz!) {
    update_kitchenQueue(
      where: { token_number: { _eq: $token_number } },
      _set: { status: $status, updated_at: $updated_at }
    ) {
      affected_rows
    }
  }
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token_number, status } = body;

    if (!token_number || !status) {
      return NextResponse.json({ error: 'Missing token_number or status' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request(UPDATE_KITCHEN_QUEUE, {
      token_number,
      status,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Kitchen Queue] Error updating kitchen queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update kitchen queue' },
      { status: 500 }
    );
  }
}
