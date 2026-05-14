import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_PET_VENDORS = gql`
  query GetAllPetVendors {
    pet_vendors(order_by: { created_at: desc }) {
      id
      fullname
      organisationName
      address
      disabled
      created_at
    }
  }
`;

export async function GET(req: Request) {
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

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const data = await hasuraClient.request<any>(GET_PET_VENDORS);
    return NextResponse.json({ vendors: data.pet_vendors || [] });
  } catch (error) {
    console.error('Error fetching pet vendors:', error);
    return NextResponse.json({ error: 'Failed to fetch pet vendors' }, { status: 500 });
  }
}
