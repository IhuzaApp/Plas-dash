import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { ADD_COMMISSION_RULE } from '@/lib/graphql/mutations';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variables } = body;

    if (!variables) {
      return NextResponse.json({ error: 'Missing variables' }, { status: 400 });
    }

    if (!variables.influencer_id || !variables.commission_type || variables.amount === undefined) {
      return NextResponse.json(
        { error: 'influencer_id, commission_type, and amount are required' },
        { status: 400 }
      );
    }

    const allowedFields = [
      'influencer_id',
      'commission_type',
      'amount',
      'order_threshold',
      'high_value_influencer_bonus',
      'high_value_order_threshold',
    ];
    const sanitizedVariables: any = {};
    allowedFields.forEach(field => {
      if (variables[field] !== undefined) {
        // If order_threshold is null, don't include it in variables to avoid Hasura validation error
        // if the column is non-nullable but has a default value.
        if (field === 'order_threshold' && variables[field] === null) {
          return;
        }
        sanitizedVariables[field] = variables[field];
      }
    });

    const data = await hasuraClient.request<any>(ADD_COMMISSION_RULE, sanitizedVariables);

    return NextResponse.json({
      success: true,
      commission_rule: data.insert_influencer_commissions_one,
    });
  } catch (error: any) {
    console.error('Add Commission Rule Error:', error.response?.errors || error.message);
    return NextResponse.json(
      { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
