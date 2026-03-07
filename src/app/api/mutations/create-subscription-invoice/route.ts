import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const CREATE_SUBSCRIPTION_INVOICE = gql`
  mutation CreateSubscriptionInvoice(
    $aiUsage_id: uuid
    $currency: String
    $discount_amount: String
    $due_date: timestamptz
    $invoice_number: String
    $issued_at: timestamptz
    $paid_at: timestamptz
    $payment_method: String
    $plan_name: String
    $plan_price: String
    $reelUsage_id: uuid
    $shopSubscription_id: uuid
    $status: String
    $subtotal_amount: String
    $tax_amount: String
    $updated_at: timestamptz
  ) {
    insert_subscription_invoices(
      objects: {
        aiUsage_id: $aiUsage_id
        currency: $currency
        deleted: false
        discount_amount: $discount_amount
        due_date: $due_date
        invoice_number: $invoice_number
        is_overdue: false
        issued_at: $issued_at
        paid_at: $paid_at
        payment_method: $payment_method
        plan_name: $plan_name
        plan_price: $plan_price
        reelUsage_id: $reelUsage_id
        shopSubscription_id: $shopSubscription_id
        status: $status
        subtotal_amount: $subtotal_amount
        tax_amount: $tax_amount
        updated_at: $updated_at
      }
    ) {
      affected_rows
    }
  }
`;

export async function POST(req: Request) {
    const context = await getUserContext(req);
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        if (!hasuraClient) throw new Error('Hasura client is not initialized');

        const data = await hasuraClient.request<{ insert_subscription_invoices: { affected_rows: number } }>(CREATE_SUBSCRIPTION_INVOICE, body);
        return NextResponse.json({ affected_rows: data.insert_subscription_invoices?.affected_rows || 0 });
    } catch (error) {
        console.error('Error creating subscription_invoice:', error);
        return NextResponse.json({ error: 'Failed to create subscription_invoice' }, { status: 500 });
    }
}
