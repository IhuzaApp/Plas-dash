import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
    headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const UPDATE_PROMOTION_MUTATION = `
  mutation UpdatePromotion($id: uuid!, $set: promotions_set_input!) {
    update_promotions(where: {id: {_eq: $id}}, _set: $set) {
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
            'usage_per_customer', 'usage_limit', 'status', 'start_time', 'start_date',
            'restaurant_id', 'shop_id', 'promotion_type', 'priority', 'name', 'min_purchase_amount',
            'end_time', 'end_date', 'discount_value', 'discount_type', 'code',
            'buy_quantity', 'applies_to_type', 'applies_to_id',
            'promotion_scope', 'customer_discount_percent', 'influencer_id', 'influencer_code', 'earning_per_order'
        ];

        const uuidFields = ['restaurant_id', 'shop_id', 'applies_to_id', 'influencer_id'];
        const dateFields = ['start_date', 'end_date'];
        const timeFields = ['start_time', 'end_time'];

        const setObject: Record<string, any> = {};
        allowedFields.forEach(field => {
            let value = variables[field];

            // Omit empty strings but keep explicit nulls for UUIDs/Dates/Times
            if (value === "") {
                if (uuidFields.includes(field) || dateFields.includes(field) || timeFields.includes(field)) {
                    return; // Omit
                }
            }

            if (value === null) {
                if (uuidFields.includes(field) || dateFields.includes(field) || timeFields.includes(field)) {
                    setObject[field] = null;
                    return;
                }
            }

            // Stringify numeric fields for Hasura
            if (['customer_discount_percent', 'earning_per_order'].includes(field) && value != null) {
                value = value.toString();
            }

            if (value !== undefined && value !== "") {
                setObject[field] = value;
            } else if (value === "" && !uuidFields.includes(field) && !dateFields.includes(field) && !timeFields.includes(field)) {
                setObject[field] = value;
            }
        });

        const data = await hasuraClient.request<any>(UPDATE_PROMOTION_MUTATION, {
            id: variables.id,
            set: setObject
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Update Promotion Error:', error.response?.errors || error.message);
        return NextResponse.json(
            { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
