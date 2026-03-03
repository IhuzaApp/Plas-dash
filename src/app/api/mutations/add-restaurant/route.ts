import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

// Using the same mutation shape as ADD_RESTAURANT defined in /src/lib/graphql/mutations.ts
const ADD_RESTAURANT_MUTATION = `
  mutation addResturantDetails(
    $email: String = ""
    $is_active: Boolean = false
    $lat: String = ""
    $location: String = ""
    $long: String = ""
    $logo: String = ""
    $name: String = ""
    $phone: String = ""
    $profile: String = ""
    $tin: String = ""
    $ussd: String = ""
  ) {
    insert_Restaurants(
      objects: {
        email: $email
        is_active: $is_active
        lat: $lat
        location: $location
        long: $long
        logo: $logo
        name: $name
        phone: $phone
        profile: $profile
        tin: $tin
        ussd: $ussd
        verified: false
      }
    ) {
      affected_rows
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variables } = body;

    const response = await hasuraClient.request(ADD_RESTAURANT_MUTATION, variables);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error adding restaurant:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
