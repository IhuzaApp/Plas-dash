import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_EMPLOYEE_BY_ID = gql`
  query GetEmployeeById($id: uuid!) {
    orgEmployees_by_pk(id: $id) {
      id
      fullnames
      email
      phone
      Position
      roleType
    }
  }
`;

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const data = await hasuraClient.request<{ orgEmployees_by_pk: any }>(GET_EMPLOYEE_BY_ID, {
      id,
    });
    return NextResponse.json({ orgEmployee: data.orgEmployees_by_pk });
  } catch (error) {
    console.error('Error fetching org employee:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch employee',
      },
      { status: 500 }
    );
  }
}
