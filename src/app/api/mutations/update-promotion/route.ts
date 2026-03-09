import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
    headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const UPDATE_PROMOTION_MUTATION = `
  mutation UpdatePromotion($id: uuid!, $usage_per_customer: Int, $usage_limit: Int, $status: String, $start_time: timetz, $start_date: timestamptz, $restaurant_id: uuid, $shop_id: uuid, $promotion_type: String, $priority: Int, $name: String, $min_purchase_amount: String, $end_time: timetz, $end_date: timestamptz, $discount_value: String, $discount_type: String, $code: String, $buy_quantity: String, $applies_to_type: String, $applies_to_id: uuid, $promotion_scope: String, $customer_discount_percent: numeric, $influencer_id: uuid, $influencer_code: String, $earning_per_order: numeric) {
    update_promotions(where: {id: {_eq: $id}}, _set: {usage_per_customer: $usage_per_customer, usage_limit: $usage_limit, status: $status, start_time: $start_time, start_date: $start_date, restaurant_id: $restaurant_id, shop_id: $shop_id, promotion_type: $promotion_type, priority: $priority, name: $name, min_purchase_amount: $min_purchase_amount, is_stackable: false, end_time: $end_time, end_date: $end_date, discount_value: $discount_value, discount_type: $discount_type, code: $code, buy_quantity: $buy_quantity, applies_to_type: $applies_to_type, applies_to_id: $applies_to_id, promotion_scope: $promotion_scope, customer_discount_percent: $customer_discount_percent, influencer_id: $influencer_id, influencer_code: $influencer_code, earning_per_order: $earning_per_order}) {
      affected_rows
    }
  }
`;

export async function POST(req: NextRequest) {
    try {
        const { variables } = await req.json();

        if (!variables || !variables.id) {
            console.error('[UPDATE_PROMOTION] Validation failed. Missing ID:', variables);
            return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
        }

        // Explicitly filter variables to match the mutation signature
        const allowedFields = [
            'id', 'usage_per_customer', 'usage_limit', 'status', 'start_time', 'start_date',
            'restaurant_id', 'shop_id', 'promotion_type', 'priority', 'name', 'min_purchase_amount',
            'end_time', 'end_date', 'discount_value', 'discount_type', 'code',
            'buy_quantity', 'applies_to_type', 'applies_to_id',
            'promotion_scope', 'customer_discount_percent', 'influencer_id', 'influencer_code', 'earning_per_order'
        ];

        const uuidFields = ['id', 'restaurant_id', 'shop_id', 'applies_to_id', 'influencer_id'];
        const dateFields = ['start_date', 'end_date', 'start_time', 'end_time'];

        const sanitizedVariables: Record<string, any> = {};
        allowedFields.forEach(field => {
            let value = variables[field];

            // Convert empty strings to null for UUID and Date/Time fields
            if (value === "" && (uuidFields.includes(field) || dateFields.includes(field))) {
                value = null;
            }

            if (value !== undefined) {
                sanitizedVariables[field] = value;
            }
        });

        const data = await hasuraClient.request<any>(UPDATE_PROMOTION_MUTATION, sanitizedVariables);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Update Promotion Error:', error.response?.errors || error.message);
        return NextResponse.json(
            { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
