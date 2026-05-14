import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const CREATE_SHOP_FULL = gql`
  mutation CreateShopFull(
    $shop: Shops_insert_input!
    $subscription: shop_subscriptions_insert_input!
    $aiUsage: ai_usage_insert_input!
    $reelUsage: reel_usage_insert_input!
    $invoice: subscription_invoices_insert_input!
  ) {
    insert_Shops_one(object: $shop) {
      id
    }
    insert_shop_subscriptions_one(object: $subscription) {
      id
    }
    insert_ai_usage_one(object: $aiUsage) {
      id
    }
    insert_reel_usage_one(object: $reelUsage) {
      id
    }
    insert_subscription_invoices_one(object: $invoice) {
      id
    }
  }
`;

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const { shop, plan, billing_cycle } = await req.json();

    // 1. Create the shop first to get the ID
    const CREATE_SHOP = gql`
      mutation CreateShop($object: Shops_insert_input!) {
        insert_Shops_one(object: $object) {
          id
        }
      }
    `;
    const shopResult = await hasuraClient.request<{ insert_Shops_one: { id: string } }>(
      CREATE_SHOP,
      {
        object: shop,
      }
    );
    const shopId = shopResult.insert_Shops_one.id;

    // 2. Prepare other records with the new shopId
    const now = new Date().toISOString();
    const endDate = new Date();
    if (billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = {
      shop_id: shopId,
      plan_id: plan.id,
      billing_cycle: billing_cycle,
      start_date: now,
      end_date: endDate.toISOString(),
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    const aiUsage = {
      shop_id: shopId,
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      request_count: plan.ai_request_limit || 0,
      requests_sent: 0,
      created_at: now,
    };

    const reelUsage = {
      shop_id: shopId,
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      upload_count: plan.reel_limit || 0,
      created_at: now,
    };

    const invoice = {
      shopSubscription_id: null, // Will be updated or linked if possible
      shop_id: shopId,
      plan_name: plan.name,
      plan_price:
        billing_cycle === 'monthly' ? plan.price_monthly.toString() : plan.price_yearly.toString(),
      currency: 'RWF',
      status: 'paid', // Assuming initial is paid or pending
      issued_at: now,
      due_date: now,
      subtotal_amount:
        billing_cycle === 'monthly' ? plan.price_monthly.toString() : plan.price_yearly.toString(),
      tax_amount: '0',
      discount_amount: '0',
      invoice_number: `INV-${Date.now()}`,
    };

    // Sequential inserts for simplicity (better as a transaction if supported via custom resolver, but here we do it step by step)
    const subResult = await hasuraClient.request(
      gql`
        mutation AddSub(
          $sub: shop_subscriptions_insert_input!
          $ai: ai_usage_insert_input!
          $reel: reel_usage_insert_input!
          $inv: subscription_invoices_insert_input!
        ) {
          insert_shop_subscriptions_one(object: $sub) {
            id
          }
          insert_ai_usage_one(object: $ai) {
            id
          }
          insert_reel_usage_one(object: $reel) {
            id
          }
          insert_subscription_invoices_one(object: $inv) {
            id
          }
        }
      `,
      {
        sub: subscription,
        ai: aiUsage,
        reel: reelUsage,
        inv: invoice,
      }
    );

    return NextResponse.json({ shopId, subResult });
  } catch (error) {
    console.error('Error creating shop with subscription:', error);
    return NextResponse.json({ error: 'Failed to create shop and subscription' }, { status: 500 });
  }
}
