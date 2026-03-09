import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
    headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const GET_INFLUENCERS = `
  query GetInfluencers {
    influencers(order_by: {name: asc}) {
      id
      name
      email
      phone
      status
      membershipId
      created_at
    }
  }
`;

const GET_INFLUENCER_BY_ID = `
  query GetInfluencerById($id: uuid!) {
    influencers_by_pk(id: $id) {
      id
      name
      email
      phone
      status
      membershipId
      description
      payment_method
      payment_terms
      momo_number
      bank_name
      bank_account_number
      bank_account_name
      contract_start_date
      contract_end_date
      created_at
      updated_at
      influencer_commissions {
        id
        commission_type
        amount
        order_threshold
        created_at
      }
      influencer_earnings {
        id
        earning_amount
        status
        created_at
        promotion_id
        shop_order_id
        restaurant_order_id
        reel_order_id
      }
      promotions {
        id
        name
        code
        status
        promotion_type
        discount_value
        influencer_code
        earning_per_order
        start_date
        end_date
      }
    }
  }
`;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const data = await hasuraClient.request<any>(GET_INFLUENCER_BY_ID, { id });
            return NextResponse.json({ influencer: data.influencers_by_pk });
        }

        const data = await hasuraClient.request<any>(GET_INFLUENCERS);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Fetch Influencers Error:', error.response?.errors || error.message);
        return NextResponse.json(
            { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
