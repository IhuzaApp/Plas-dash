import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Admin dashboard: fetches all tickets (no filter).
const GET_TICKETS = gql`
  query GetTickets {
    tickets(order_by: { created_on: desc }) {
      id
      ticket_num
      subject
      status
      priority
      user_id
      created_on
      update_on
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const data = await hasuraClient.request<{ tickets: any[] }>(GET_TICKETS);
    return NextResponse.json({ tickets: data.tickets || [] });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
