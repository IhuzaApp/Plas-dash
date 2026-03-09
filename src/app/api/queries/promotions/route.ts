import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_PROMOTIONS = gql`
query GetPromotions($where: promotions_bool_exp) {
  promotions(where: $where, order_by: {created_at: desc}) {
    id
    min_purchase_amount
    is_stackable
    name
    promotion_type
    priority
    restaurant_id
    shop_id
    Shop {
      name
      description
      category_id
      created_at
      logo
      longitude
      latitude
      image
      phone
      relatedTo
      ssd
      tin
    }
    Restaurant {
      name
      is_active
      phone
      profile
      tin
      ussd
    }
    start_date
    start_time
    status
    usage_limit
    usage_per_customer
    end_time
    end_date
    discount_value
    discount_type
    created_at
    code
    buy_quantity
    applies_to_type
    applies_to_id
    update_on
  }
}
`;

export async function GET(req: Request) {
  const context = await getUserContext(req);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasuraClient) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

  const { isProjectUser, shop_id, restaurant_id } = context;

  // Filtering: Project users see everything, shop/restaurant employees see only their business
  const where: any = {};
  if (!isProjectUser) {
    if (shop_id) {
      where.shop_id = { _eq: shop_id };
    } else if (restaurant_id) {
      where.restaurant_id = { _eq: restaurant_id };
    } else {
      // Authenticated but no business assigned, return empty list
      return NextResponse.json({ promotions: [] });
    }
  }

  try {
    const data = await hasuraClient.request<{ promotions: unknown[] }>(GET_PROMOTIONS, { where });
    return NextResponse.json({ promotions: data.promotions ?? [] });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}
