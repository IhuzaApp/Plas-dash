import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const UPDATE_RESTAURANT_DISH_MUTATION = `
  mutation UpdateRestaurantDish(
    $id: uuid!,
    $discount: String = "",
    $dish_id: uuid = null,
    $preparingTime: String = "",
    $price: String = "",
    $product_id: uuid = null,
    $promo_type: String = "",
    $promo: Boolean = false,
    $is_active: Boolean = false,
    $quantity: String = "",
    $image: String = "",
    $updated_at: timestamptz = "now()"
  ) {
    update_restaurant_menu(
      where: { id: { _eq: $id } },
      _set: {
        discount: $discount,
        dish_id: $dish_id,
        is_active: $is_active,
        preparingTime: $preparingTime,
        price: $price,
        product_id: $product_id,
        promo: $promo,
        promo_type: $promo_type,
        quantity: $quantity,
        image: $image,
        updated_at: $updated_at
      }
    ) {
      affected_rows
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variables } = body;

    if (!variables.id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const response = await hasuraClient.request(UPDATE_RESTAURANT_DISH_MUTATION, variables);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating restaurant dish:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
