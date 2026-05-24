import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_SUBSCRIPTION_INVOICES = gql`
  query GetSubscriptionInvoices {
    subscription_invoices(order_by: { issued_at: desc }) {
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
      updated_at
      ai_usage {
        business_id
        id
        month
        request_count
        restaurant_id
        shop_id
        user_id
        year
        User {
          email
          id
          name
          is_guest
          is_active
          gender
          phone
          profile_picture
          role
        }
        Shop {
          address
          category_id
          created_at
          image
          id
          is_active
          name
          logo
          phone
          tin
          ssd
        }
        Restaurant {
          email
          name
          phone
          profile
          tin
          ussd
          verified
        }
        business_account {
          account_type
          business_email
          business_name
          business_phone
          face_image
          id_image
        }
      }
      reel_usage {
        business_id
        id
        month
        restaurant_id
        shop_id
        upload_count
        year
        Shop {
          id
          image
          logo
          name
          is_active
          phone
          tin
          ssd
        }
        business_account {
          account_type
          business_email
          business_location
          business_name
          id
          id_image
          updated_at
          status
        }
        Restaurant {
          email
          id
          is_active
          logo
          name
          phone
          profile
          tin
          ussd
          verified
          created_at
        }
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
          created_at
          ai_request_limit
          description
          id
          name
          price_monthly
          price_yearly
          reel_limit
        }
        business_account {
          business_name
          id
          business_phone
          business_location
          id_image
          face_image
          created_at
          updated_at
        }
        Shop {
          address
          id
          image
          category_id
          is_active
          logo
          name
          phone
          ssd
          tin
        }
        Restaurant {
          id
          email
          logo
          name
          phone
          profile
          ussd
          tin
        }
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
    const data = await hasuraClient.request<{ subscription_invoices: any[] }>(
      GET_SUBSCRIPTION_INVOICES
    );
    return NextResponse.json({ subscription_invoices: data.subscription_invoices || [] });
  } catch (error) {
    console.error('Error fetching subscription_invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription_invoices' }, { status: 500 });
  }
}
