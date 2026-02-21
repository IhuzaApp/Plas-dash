import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { GET_REFERRAL_WINDOW } from '@/lib/graphql/queries';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = (session?.user as { id?: string } | undefined)?.id;

        // Fallback to Bearer token if session is not available
        if (!userId) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                userId = authHeader.substring(7);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasuraClient) {
            return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
        }

        const data = await hasuraClient.request(GET_REFERRAL_WINDOW);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching referral window data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch referral data' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userIdauth = (session?.user as { id?: string } | undefined)?.id;

        // Fallback to Bearer token if session is not available
        if (!userIdauth) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                userIdauth = authHeader.substring(7);
            }
        }

        if (!userIdauth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, status, phoneVerified } = await req.json();

        if (!id || status === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!hasuraClient) {
            return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
        }

        const { UPDATE_REFERRAL_WINDOW_STATUS } = await import('@/lib/graphql/mutations');

        const data = await hasuraClient.request(UPDATE_REFERRAL_WINDOW_STATUS, {
            id,
            status,
            phoneVerified: !!phoneVerified
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating referral window status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update referral status' },
            { status: 500 }
        );
    }
}
