import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

const GET_SYSTEM_CONFIG = gql`
  query getSystemConfiguration {
    System_configuratioins {
      baseDeliveryFee
      serviceFee
      shoppingTime
      unitsSurcharge
      extraUnits
      cappedDistanceFee
      distanceSurcharge
      currency
      discounts
      deliveryCommissionPercentage
      productCommissionPercentage
      withDrawCharges
    }
  }
`;

interface SystemConfigResponse {
    System_configuratioins: Array<{
        baseDeliveryFee: string;
        serviceFee: string;
        shoppingTime: string;
        unitsSurcharge: string;
        extraUnits: string;
        cappedDistanceFee: string;
        distanceSurcharge: string;
        currency: string;
        discounts: any;
        deliveryCommissionPercentage: string;
        productCommissionPercentage: string;
        withDrawCharges: string;
    }>;
}

export async function GET(req: Request) {
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

        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        const data = await hasuraClient.request<SystemConfigResponse>(GET_SYSTEM_CONFIG);
        const config = data.System_configuratioins[0] || null;

        return NextResponse.json({
            success: true,
            config,
        });

    } catch (error: any) {
        console.error('Error fetching system configuration:', error);
        return NextResponse.json({
            error: 'Failed to fetch system configuration',
            message: error.message,
        }, { status: 500 });
    }
}
