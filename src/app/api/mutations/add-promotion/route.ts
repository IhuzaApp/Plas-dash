import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const ADD_PROMOTION_MUTATION = `
  mutation AddPromotion($object: promotions_insert_input!) {
    insert_promotions_one(object: $object) {
      id
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

    // Explicitly filter variables and handle type conversions
    const allowedFields = [
      'usage_per_customer',
      'usage_limit',
      'status',
      'start_time',
      'start_date',
      'restaurant_id',
      'shop_id',
      'promotion_type',
      'priority',
      'name',
      'min_purchase_amount',
      'end_time',
      'end_date',
      'discount_value',
      'discount_type',
      'code',
      'buy_quantity',
      'applies_to_type',
      'applies_to_id',
      'promotion_scope',
      'customer_discount_percent',
      'influencer_id',
      'influencer_code',
      'earning_per_order',
    ];

    const uuidFields = ['restaurant_id', 'shop_id', 'applies_to_id', 'influencer_id'];
    const dateFields = ['start_date', 'end_date'];
    const timeFields = ['start_time', 'end_time'];

    const insertObject: Record<string, any> = {
      is_stackable: false, // Default
    };

    allowedFields.forEach(field => {
      let value = variables[field];

      // Omit empty strings for UUIDs, Dates, and Times, but keep explicit nulls
      if (value === '') {
        if (
          uuidFields.includes(field) ||
          dateFields.includes(field) ||
          timeFields.includes(field)
        ) {
          return; // Omit empty strings
        }
      }

      if (value === null) {
        if (
          uuidFields.includes(field) ||
          dateFields.includes(field) ||
          timeFields.includes(field)
        ) {
          insertObject[field] = null; // Keep explicit nulls for UUID/Date/Time
          return;
        }
      }

      // Special handling for numeric fields that Hasura expects as Strings
      if (['customer_discount_percent', 'earning_per_order'].includes(field) && value != null) {
        value = value.toString();
      }

      if (value !== undefined && value !== '') {
        insertObject[field] = value;
      } else if (
        value === '' &&
        !uuidFields.includes(field) &&
        !dateFields.includes(field) &&
        !timeFields.includes(field)
      ) {
        insertObject[field] = value;
      }
    });

    console.log(
      '[ADD_PROMOTION] Sanitized object for Hasura:',
      JSON.stringify(insertObject, null, 2)
    );

    const data = await hasuraClient.request<any>(ADD_PROMOTION_MUTATION, { object: insertObject });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Add Promotion Error:', error.response?.errors || error.message);
    return NextResponse.json(
      { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
