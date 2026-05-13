import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const { restaurant, plan, billing_cycle } = await req.json();

    // Prepare dates
    const now = new Date().toISOString();
    const endDate = new Date();
    if (billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const planPrice = billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const invoiceNumber = `INV-RES-${Date.now()}`;

    // Full nested mutation based on user requirements
    const CREATE_RESTAURANT_FULL = gql`
      mutation CreateRestaurantFull($object: Restaurants_insert_input!) {
        insert_Restaurants_one(object: $object) {
          id
          name
        }
      }
    `;

    const restaurantObject = {
      ...restaurant,
      is_active: false,
      verified: false,
      created_at: now,
      updated_at: now,
      // Nested insertions based on user's provided mutation structure
      reel_usages: {
        data: {
          month: (new Date().getMonth() + 1).toString(),
          year: new Date().getFullYear().toString(),
          upload_count: plan.reel_limit || 10,
          created_at: now,
        }
      },
      merchant_wallet: {
        data: {
          active: true,
          balance: '0',
          update_at: now,
          created_at: now,
        }
      },
      ai_usage: {
        data: {
          month: (new Date().getMonth() + 1).toString(),
          year: (new Date().getFullYear()).toString(),
          request_count: plan.ai_request_limit || 10,
          requests_sent: 0,
          user_id: context.userId,
        }
      },
      shop_subscription: {
        data: {
          plan_id: plan.id,
          billing_cycle: billing_cycle,
          start_date: now,
          end_date: endDate.toISOString(),
          status: 'active',
          created_at: now,
          updated_at: now,
          subscription_invoices: {
            data: {
              plan_name: plan.name,
              plan_price: planPrice.toString(),
              currency: 'RWF',
              status: 'paid',
              issued_at: now,
              due_date: now,
              subtotal_amount: planPrice.toString(),
              tax_amount: '0',
              discount_amount: '0',
              invoice_number: invoiceNumber,
              created_at: now,
              updated_at: now,
            }
          }
        }
      }
    };

    const result = await hasuraClient.request(CREATE_RESTAURANT_FULL, {
      object: restaurantObject,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error creating restaurant with subscription:', error);
    return NextResponse.json({ error: 'Failed to create restaurant and subscription' }, { status: 500 });
  }
}
