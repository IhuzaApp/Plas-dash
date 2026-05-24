import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { UPDATE_INFLUENCER } from '@/lib/graphql/mutations';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variables } = body;

    if (!variables || !variables.id) {
      return NextResponse.json({ error: 'Missing variables or id' }, { status: 400 });
    }

    const allowedFields = [
      'id',
      'name',
      'email',
      'phone',
      'status',
      'membershipId',
      'description',
      'payment_method',
      'payment_terms',
      'momo_number',
      'bank_name',
      'bank_account_number',
      'bank_account_name',
      'contract_start_date',
      'contract_end_date',
    ];

    const sanitizedVariables: any = {};
    allowedFields.forEach(field => {
      if (variables[field] !== undefined) {
        sanitizedVariables[field] = variables[field] || (field === 'id' ? undefined : null);
      }
    });

    // Ensure id is present in handled variables
    sanitizedVariables.id = variables.id;

    const data = await hasuraClient.request<any>(UPDATE_INFLUENCER, sanitizedVariables);

    return NextResponse.json({
      success: true,
      influencer: data.update_influencers_by_pk,
    });
  } catch (error: any) {
    console.error('Update Influencer Error:', error.response?.errors || error.message);
    return NextResponse.json(
      { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
