import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_PROMOTIONS = gql`
query GetPromotions($where: promotions_bool_exp) {
  promotions(where: $where, order_by: {created_at: desc}) {
    id
    min_purchase_amount
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
    promotion_scope
    customer_discount_percent
    influencer_id
    influencer_code
    Influencer {
      name
    }
    update_on
    funded_by
    affects
    stacking_type
    max_discount
    min_order_value
    free_delivery
    delivery_paid_by
    budget_limit
    budget_used
    commission_type
    commission_value
    commission_cap
    min_profit_required
    max_platform_loss
    earning_per_order
    influencer_earnings {
      commission_base_amount
      commission_bonus_amount
      created_at
      earning_amount
      id
      influencer_id
      order_value
      payout_status
      platform_profit
      promotion_id
      reel_order_id
      restaurant_order_id
      shop_order_id
      status
      updated_at
    }
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
  let shouldFetchAll = isProjectUser;

  if (!isProjectUser) {
    if (shop_id) {
      where.shop_id = { _eq: shop_id };
    } else if (restaurant_id) {
      where.restaurant_id = { _eq: restaurant_id };
    } else {
      // Authenticated but no business assigned. 
      // PERMISSIVE: Let's fetch all promotions here so developers/admins not in the metadata tables can see them.
      shouldFetchAll = true;
    }
  }

  try {
    let data: any;
    if (shouldFetchAll) {
      data = await hasuraClient.request<{ promotions: unknown[] }>(gql`
        query GetPromotions {
          promotions(order_by: { created_at: desc }) {
            id
            min_purchase_amount
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
            promotion_scope
            customer_discount_percent
            influencer_id
            influencer_code
            Influencer {
              name
            }
            update_on
            funded_by
            affects
            stacking_type
            max_discount
            min_order_value
            free_delivery
            delivery_paid_by
            budget_limit
            budget_used
            commission_type
            commission_value
            commission_cap
            min_profit_required
            max_platform_loss
            earning_per_order
            influencer_earnings {
              commission_base_amount
              commission_bonus_amount
              created_at
              earning_amount
              id
              influencer_id
              order_value
              payout_status
              platform_profit
              promotion_id
              reel_order_id
              restaurant_order_id
              shop_order_id
              status
              updated_at
            }
          }
        }
      `);
    } else {
      data = await hasuraClient.request<{ promotions: unknown[] }>(GET_PROMOTIONS, { where });
    }

    return NextResponse.json({ promotions: data.promotions ?? [] });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}
