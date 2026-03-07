import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const INSERT_SHOP_SUBSCRIPTION = gql`
  mutation InsertShopSubscription($object: shop_subscriptions_insert_input!) {
    insert_shop_subscriptions_one(object: $object) {
      id
    }
  }
`;

import { SubscriptionService } from '@/modules/subscriptions/services/SubscriptionService';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
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

  try {
    const body = await req.json();
    const service = new SubscriptionService();
    const data = await service.handleSubscriptionAssignment(body, userId);

    return NextResponse.json({ data: { insert_shop_subscriptions_one: data } });
  } catch (error) {
    console.error('Error mutating shop_subscriptions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mutate shop_subscriptions' },
      { status: 500 }
    );
  }
}
