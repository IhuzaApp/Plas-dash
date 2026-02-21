import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Admin dashboard: fetches all products (no filter).
const GET_PRODUCTS = gql`
  query GetProducts {
    Products(order_by: { created_at: desc }) {
      id
      ProductName {
        id
        name
        description
        barcode
        sku
        image
        create_at
      }
      Shop {
        id
        name
      }
      price
      final_price
      created_at
      category
      image
      is_active
      measurement_unit
      quantity
      shop_id
      updated_at
    }
  }
`;

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
    const data = await hasuraClient.request<{ Products: any[] }>(GET_PRODUCTS);
    return NextResponse.json({ products: data.Products || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
