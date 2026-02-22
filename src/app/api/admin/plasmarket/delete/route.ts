import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const DELETE_BUSINESS = gql`
  mutation DeleteBusiness($id: uuid!) {
    delete_business_accounts_by_pk(id: $id) {
      id
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

        const { businessId } = await req.json();

        if (!businessId) {
            return NextResponse.json({ error: 'Missing businessId param' }, { status: 400 });
        }

        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        const result = await hasuraClient.request<any>(DELETE_BUSINESS, {
            id: businessId,
        });

        if (!result.delete_business_accounts_by_pk) {
            return NextResponse.json({ error: 'Business account not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            deletedId: result.delete_business_accounts_by_pk.id,
        });

    } catch (error: any) {
        console.error('Error deleting business account:', error);
        return NextResponse.json({
            error: 'Failed to delete business account',
            message: error.message,
        }, { status: 500 });
    }
}
