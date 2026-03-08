import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const ADD_DISH_TO_MENU_MUTATION = `
  mutation AddDishToMenu(
    $restaurant_id: uuid!,
    $dish_id: uuid,
    $price: String!,
    $discount: String = "0",
    $quantity: String = "0",
    $preparingTime: String = "",
    $is_active: Boolean = true,
    $promo: Boolean = false,
    $promo_type: String = "",
    $image: String = "",
    $product_id: uuid,
    $SKU: String = ""
  ) {
    insert_restaurant_menu_one(object: {
      restaurant_id: $restaurant_id,
      dish_id: $dish_id,
      price: $price,
      discount: $discount,
      quantity: $quantity,
      preparingTime: $preparingTime,
      is_active: $is_active,
      promo: $promo,
      promo_type: $promo_type,
      image: $image,
      product_id: $product_id,
      SKU: $SKU
    }) {
      id
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const { variables } = await req.json();


    if (!variables || !variables.restaurant_id || (!variables.dish_id && !variables.product_id) || variables.price === undefined || variables.price === null || variables.price === '') {
      console.error('[ADD_DISH_TO_MENU] Validation failed. Missing required fields:', { restaurant_id: variables?.restaurant_id, dish_id: variables?.dish_id, product_id: variables?.product_id, price: variables?.price });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await hasuraClient.request<any>(ADD_DISH_TO_MENU_MUTATION, variables);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Add Dish to Menu Error:', error.response?.errors || error.message);
    return NextResponse.json(
      { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
