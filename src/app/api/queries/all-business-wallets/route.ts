import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { GET_BUSINESS_WALLETS } from '@/lib/graphql/queries';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            userId = authHeader.substring(7);
        }
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }
        const data = await hasuraClient.request<any>(GET_BUSINESS_WALLETS);
        return NextResponse.json({ business_wallet: data.business_wallet || [] });
    } catch (error) {
        console.error('Error fetching business wallets:', error);
        return NextResponse.json({ error: 'Failed to fetch business wallets' }, { status: 500 });
    }
}
