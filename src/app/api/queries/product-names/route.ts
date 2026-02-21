import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Catalog view for project users: product names only (no shop, no prices).
const GET_PRODUCT_NAMES = gql`
  query GetProductNames {
    productNames(order_by: { create_at: asc }) {
      id
      name
      description
      barcode
      sku
      image
      create_at
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
    const data = await hasuraClient.request<{ productNames: any[] }>(GET_PRODUCT_NAMES);
    return NextResponse.json({ productNames: data.productNames || [] });
  } catch (error) {
    console.error('Error fetching product names:', error);
    return NextResponse.json({ error: 'Failed to fetch product names' }, { status: 500 });
  }
}
