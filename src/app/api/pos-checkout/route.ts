import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const INSERT_SHOP_CHECKOUT = gql`
  mutation InsertShopCheckout(
    $Processed_By: uuid
    $cartItems: jsonb
    $payment_method: String
    $shop_id: uuid
    $subtotal: String
    $tax: String
    $tin: String
    $total: String
  ) {
    insert_shopCheckouts(
      objects: {
        Processed_By: $Processed_By
        cartItems: $cartItems
        payment_method: $payment_method
        shop_id: $shop_id
        subtotal: $subtotal
        tax: $tax
        tin: $tin
        total: $total
      }
    ) {
      affected_rows
      returning {
        id
        number
      }
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const body = await request.json();
    const result = await hasuraClient.request(INSERT_SHOP_CHECKOUT, {
      Processed_By: body.Processed_By || null,
      cartItems: body.cartItems ?? null,
      payment_method: body.payment_method || null,
      shop_id: body.shop_id || null,
      subtotal: body.subtotal || null,
      tax: body.tax || null,
      tin: body.tin || null,
      total: body.total || null,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('POS checkout error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Checkout failed',
      },
      { status: 500 }
    );
  }
}
