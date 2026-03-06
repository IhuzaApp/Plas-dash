import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_BUSINESS_ACCOUNTS = gql`
  query GetBusinessAccounts {
    business_accounts(order_by: { business_name: asc }) {
      id
      business_name
      business_email
      business_phone
      status
    }
  }
`;

export async function GET(req: Request) {
    const context = await getUserContext(req);
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!hasuraClient) throw new Error('Hasura client is not initialized');
        const data = await hasuraClient.request<{ business_accounts: any[] }>(GET_BUSINESS_ACCOUNTS);
        return NextResponse.json({ business_accounts: data.business_accounts || [] });
    } catch (error) {
        console.error('Error fetching business_accounts:', error);
        return NextResponse.json({ error: 'Failed to fetch business accounts' }, { status: 500 });
    }
}
