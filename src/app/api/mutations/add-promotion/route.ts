import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const ADD_PROMOTION_MUTATION = `
  mutation AddPromotion($usage_per_customer: Int = 10, $usage_limit: Int = 10, $status: String = "", $start_time: timetz = null, $start_date: timestamptz = null, $restaurant_id: uuid = null, $shop_id: uuid = null, $promotion_type: String = "", $priority: Int = 10, $name: String = "", $min_purchase_amount: String = "", $end_time: timetz = null, $end_date: timestamptz = null, $discount_value: String = "", $discount_type: String = "", $code: String = "", $buy_quantity: String = "", $applies_to_type: String = "", $applies_to_id: uuid = null) {
    insert_promotions(objects: {usage_per_customer: $usage_per_customer, usage_limit: $usage_limit, status: $status, start_time: $start_time, start_date: $start_date, restaurant_id: $restaurant_id, shop_id: $shop_id, promotion_type: $promotion_type, priority: $priority, name: $name, min_purchase_amount: $min_purchase_amount, is_stackable: false, end_time: $end_time, end_date: $end_date, discount_value: $discount_value, discount_type: $discount_type, code: $code, buy_quantity: $buy_quantity, applies_to_type: $applies_to_type, applies_to_id: $applies_to_id}) {
      affected_rows
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const { variables } = await req.json();

    console.log('[ADD_PROMOTION] Received variables:', JSON.stringify(variables, null, 2));

    if (!variables || !variables.name || !variables.promotion_type) {
      console.error('[ADD_PROMOTION] Validation failed. Missing required fields:', variables);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Explicitly filter variables and handle type conversions (e.g., "" to null for UUIDs)
    const allowedFields = [
      'usage_per_customer', 'usage_limit', 'status', 'start_time', 'start_date',
      'restaurant_id', 'shop_id', 'promotion_type', 'priority', 'name', 'min_purchase_amount',
      'end_time', 'end_date', 'discount_value', 'discount_type', 'code',
      'buy_quantity', 'applies_to_type', 'applies_to_id'
    ];

    const uuidFields = ['restaurant_id', 'shop_id', 'applies_to_id'];
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

    console.log('[ADD_PROMOTION] Sanitized variables for Hasura:', JSON.stringify(sanitizedVariables, null, 2));

    const data = await hasuraClient.request<any>(ADD_PROMOTION_MUTATION, sanitizedVariables);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Add Promotion Error:', error.response?.errors || error.message);
    return NextResponse.json(
      { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
