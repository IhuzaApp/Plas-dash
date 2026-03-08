import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_RESTAURANT_BY_ID = gql`
  query GetRestaurantById($id: uuid!) {
    Restaurants_by_pk(id: $id) {
      id
      name
      email
      phone
      location
      lat
      long
      logo
      profile
      verified
      is_active
      relatedTo
      tin
      ussd
      created_at
      ai_usages {
        business_id
        id
        month
        request_count
        restaurant_id
        shop_id
        user_id
        year
        subscription_invoices {
          aiUsage_id
          created_at
          currency
          deleted
          deleted_at
          discount_amount
          due_date
          id
          invoice_number
          is_overdue
          issued_at
          paid_at
          payment_method
          plan_name
          plan_price
          reelUsage_id
          shopSubscription_id
          status
          subtotal_amount
          tax_amount
          reel_usage {
            business_id
            id
            month
            restaurant_id
            shop_id
            upload_count
            year
          }
          updated_at
        }
      }
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
      }
      reel_usages {
        business_id
        id
        month
        restaurant_id
        shop_id
        upload_count
        year
      }
      shop_subscription {
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
          price_monthly
          price_yearly
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
            plan {
              ai_request_limit
              created_at
              description
              id
              name
              price_monthly
              price_yearly
              reel_limit
            }
          }
        }
        subscription_invoices {
          aiUsage_id
          created_at
          deleted
          currency
          issued_at
          is_overdue
          invoice_number
        }
      }
      restaurant_dishes {
        SKU
        created_at
        discount
        dish_id
        id
        is_active
        preparingTime
        price
        product_id
        promo
        promo_type
        quantity
        restaurant_id
        image
        updated_at
        dishes {
          category
          created_at
          description
          id
          image
          ingredients
          name
          update_at
        }
      }
      restaurant_orders(order_by: { created_at: desc }) {
        id
        OrderID
        status
        total
        created_at
        updated_at
        delivery_fee
        delivery_notes
        restaurant_order_items {
          id
          quantity
          price
          restaurant_dishes {
            dishes {
              name
              image
            }
          }
        }
      }
    }
}
`;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    try {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }
        const data = await hasuraClient.request<{
            Restaurants_by_pk: Record<string, unknown> | null;
        }>(GET_RESTAURANT_BY_ID, { id });
        const restaurant = data.Restaurants_by_pk;
        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }
        return NextResponse.json({ restaurant });
    } catch (error) {
        console.error('Error fetching restaurant by id:', error);
        return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
    }
}
