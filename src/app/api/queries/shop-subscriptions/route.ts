import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_SHOP_SUBSCRIPTIONS = gql`
  query GetShopSubscriptions {
    shop_subscriptions(order_by: { created_at: desc }) {
      billing_cycle
      business_id
      created_at
      end_date
      id
      plan_id
      restaurant_id
      shop_id
      start_date
      status
      updated_at
      plan {
        ai_request_limit
        created_at
        description
        id
        name
        price_yearly
        price_monthly
        reel_limit
        plan_modules {
          id
          module_id
          plan_id
          module {
            created_at
            group_name
            id
            name
            slug
          }
        }
      }
      business_account {
        account_type
        business_email
        business_location
        business_name
        business_phone
        created_at
        face_image
        id
        id_image
        rdb_certificate
        status
        updated_at
        user_id
      }
      Restaurant {
        created_at
        email
        id
        is_active
        logo
        name
        phone
        profile
        ussd
        tin
      }
      Shop {
        address
        category_id
        created_at
        description
        image
        id
        is_active
        latitude
        logo
        longitude
        name
        operating_hours
        phone
        ssd
        tin
        updated_at
      }
    }
  }
`;

export async function GET(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    const restaurantId = searchParams.get('restaurant_id');

    let query = GET_SHOP_SUBSCRIPTIONS;
    let variables = {};

    if (shopId || restaurantId) {
      query = gql`
        query GetFilteredShopSubscriptions($where: shop_subscriptions_bool_exp!) {
          shop_subscriptions(where: $where, order_by: { created_at: desc }) {
            billing_cycle
            business_id
            created_at
            end_date
            id
            plan_id
            restaurant_id
            shop_id
            start_date
            status
            updated_at
            plan {
              ai_request_limit
              created_at
              description
              id
              name
              price_yearly
              price_monthly
              reel_limit
              plan_modules {
                id
                module_id
                plan_id
                module {
                  created_at
                  group_name
                  id
                  name
                  slug
                }
              }
            }
          }
        }
      `;

      const where: any = { status: { _eq: "active" } };
      if (shopId) where.shop_id = { _eq: shopId };
      if (restaurantId) where.restaurant_id = { _eq: restaurantId };

      variables = { where };
    }

    const data = await hasuraClient.request<{ shop_subscriptions: any[] }>(query, variables);
    return NextResponse.json({ shop_subscriptions: data.shop_subscriptions || [] });
  } catch (error) {
    console.error('Error fetching shop_subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch shop_subscriptions' }, { status: 500 });
  }
}
