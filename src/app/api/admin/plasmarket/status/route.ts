import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const UPDATE_BUSINESS_STATUS = gql`
  mutation UpdateBusinessStatus($id: uuid!, $status: String!) {
    update_business_accounts_by_pk(
      pk_columns: { id: $id },
      _set: { status: $status }
    ) {
      id
      status
    }
  }
`;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = (session as any)?.user?.id;

        if (!userId) {
            const authHeader = req.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                userId = authHeader.substring(7);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { businessId, status } = await req.json();

        if (!businessId || !status) {
            return NextResponse.json({ error: 'Missing businessId or status' }, { status: 400 });
        }

        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        const result = await hasuraClient.request<any>(UPDATE_BUSINESS_STATUS, {
            id: businessId,
            status: status
        });

        if (!result.update_business_accounts_by_pk) {
            return NextResponse.json({ error: 'Business account not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            business: result.update_business_accounts_by_pk,
        });

    } catch (error: any) {
        console.error('Error updating business status:', error);
        return NextResponse.json({
            error: 'Failed to update business status',
            message: error.message,
        }, { status: 500 });
    }
}
