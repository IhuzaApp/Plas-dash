import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// We use two mutations: one for retail (Products) and one for restaurant (restaurant_menu)
const DECREMENT_PRODUCT_STOCK = gql`
  mutation DecrementProductStock($id: uuid!, $qty: numeric!) {
    update_Products_by_pk(
      pk_columns: { id: $id }
      _inc: { quantity: $qty }
    ) {
      id
      quantity
    }
  }
`;

const DECREMENT_MENU_STOCK = gql`
  mutation DecrementMenuStock($id: uuid!, $qty: numeric!) {
    update_restaurant_menu_by_pk(
      pk_columns: { id: $id }
      _inc: { quantity: $qty }
    ) {
      id
      quantity
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const { items, isRestaurant } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items payload' }, { status: 400 });
    }

    // Execute updates asynchronously to not block the frontend response
    const updatePromises = items.map(async (item: any) => {
      try {
        if (isRestaurant) {
          await hasuraClient.request(DECREMENT_MENU_STOCK, {
            id: item.id,
            qty: -Math.abs(item.quantity)
          });
        } else {
          await hasuraClient.request(DECREMENT_PRODUCT_STOCK, {
            id: item.id,
            qty: -Math.abs(item.quantity)
          });
        }
      } catch (err) {
        console.error(`Failed to update stock for item ${item.id}:`, err);
      }
    });

    // We await them here so the serverless function doesn't die before they complete, 
    // but the frontend isn't blocking on this API call since it runs in the background.
    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, count: items.length });
  } catch (error) {
    console.error('Stock update error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Stock update failed',
      },
      { status: 500 }
    );
  }
}
