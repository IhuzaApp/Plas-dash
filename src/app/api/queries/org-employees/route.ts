import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const ORG_EMPLOYEES_QUERY = gql`
  query GetOrgEmployees {
    orgEmployees {
      Address
      Position
      active
      created_on
      dob
      email
      employeeID
      fullnames
      gender
      generatePassword
      id
      last_login
      multAuthEnabled
      online
      password
      phone
      restaurant_id
      roleType
      shop_id
      twoFactorSecrets
      updated_on
      orgEmployeeRoles {
        created_on
        id
        orgEmployeeID
        privillages
        update_on
      }
      Shops {
        address
        category_id
        created_at
        description
        id
        image
        is_active
        latitude
        logo
        longitude
        name
        operating_hours
        phone
        relatedTo
        ssd
        tin
        updated_at
      }
    }
  }
`;

export async function GET(_request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = _request.headers.get('authorization');
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
    const data = await hasuraClient.request(ORG_EMPLOYEES_QUERY);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching org employees:', error);
    return NextResponse.json({ error: 'Failed to fetch org employees' }, { status: 500 });
  }
}
