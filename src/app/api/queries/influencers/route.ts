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
      bank_account_name
      bank_account_number
      bank_name
      contract_end_date
      contract_start_date
      description
      momo_number
      payment_method
      payment_terms
      updated_at
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
        high_value_influencer_bonus
        high_value_order_threshold
        created_at
        influencer_id
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
        influencer_id
        updated_at
      }
      promotions {
        id
        name
        code
        status
        promotion_type
        discount_value
        influencer_code
        commission_type
        commission_value
        commission_cap
        start_date
        end_date
        created_at
        customer_discount_percent
        discount_type
        applies_to_type
        buy_quantity
        applies_to_id
        influencer_id
        min_purchase_amount
        priority
        promotion_scope
        restaurant_id
        shop_id
        start_time
        update_on
        usage_limit
        usage_per_customer
        influencer_earnings {
          created_at
          earning_amount
          id
          influencer_id
          promotion_id
          reel_order_id
          restaurant_order_id
          shop_order_id
          status
          updated_at
        }
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
