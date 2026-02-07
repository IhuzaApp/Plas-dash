import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ACTIVE_CART = gql`
  query GetActiveCart($user_id: uuid!, $shop_id: uuid!) {
    Carts(
      where: {
        user_id: { _eq: $user_id }
        shop_id: { _eq: $shop_id }
        is_active: { _eq: true }
      }
      limit: 1
    ) {
      id
    }
  }
`;

const ADD_CART = gql`
  mutation AddCart($user_id: uuid!, $shop_id: uuid!) {
    insert_Carts(
      objects: {
        user_id: $user_id
        shop_id: $shop_id
        total: "0"
        is_active: true
      }
    ) {
      returning {
        id
      }
    }
  }
`;

const GET_PRODUCT_PRICE = gql`
  query GetProductPrice($id: uuid!) {
    Products_by_pk(id: $id) {
      final_price
      price
    }
  }
`;

const ADD_ITEM = gql`
  mutation AddItem(
    $cart_id: uuid!
    $product_id: uuid!
    $quantity: Int!
    $price: String!
  ) {
    insert_Cart_Items(
      objects: {
        cart_id: $cart_id
        product_id: $product_id
        quantity: $quantity
        price: $price
      }
    ) {
      affected_rows
    }
  }
`;

const GET_CART_ITEMS = gql`
  query GetCartItems($cart_id: uuid!) {
    Cart_Items(where: { cart_id: { _eq: $cart_id } }) {
      price
      quantity
    }
  }
`;

const UPDATE_CART_TOTAL = gql`
  mutation UpdateCartTotal($cart_id: uuid!, $total: String!) {
    update_Carts_by_pk(pk_columns: { id: $cart_id }, _set: { total: $total }) {
      id
    }
  }
`;

const GET_CART_WITH_ITEMS = gql`
  query GetCartWithItems($user_id: uuid!, $shop_id: uuid!) {
    Carts(
      where: {
        user_id: { _eq: $user_id }
        shop_id: { _eq: $shop_id }
        is_active: { _eq: true }
      }
      limit: 1
    ) {
      id
      Cart_Items {
        id
        product_id
        price
        quantity
      }
    }
    Shops_by_pk(id: $shop_id) {
      name
      latitude
      longitude
    }
  }
`;

const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds($ids: [uuid!]!) {
    Products(where: { id: { _in: $ids } }) {
      id
      ProductName {
        name
        description
      }
      image
      measurement_unit
      quantity
    }
  }
`;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = session.user.id;
  const { searchParams } = new URL(request.url);
  const shop_id = searchParams.get("shop_id");
  if (!shop_id) {
    return NextResponse.json({ error: "Missing shop_id" }, { status: 400 });
  }
  try {
    if (!hasuraClient) throw new Error("Hasura client is not initialized");
    const data = await hasuraClient.request<{
      Carts: Array<{
        id: string;
        Cart_Items: Array<{
          id: string;
          product_id: string;
          price: string;
          quantity: number;
        }>;
      }>;
      Shops_by_pk?: { name: string; latitude: string; longitude: string };
    }>(GET_CART_WITH_ITEMS, { user_id, shop_id });
    const cart = data.Carts[0];
    const shopName = data.Shops_by_pk?.name || "";
    const shopLatitude = data.Shops_by_pk?.latitude || null;
    const shopLongitude = data.Shops_by_pk?.longitude || null;
    const rawItems = cart?.Cart_Items || [];
    const productIds = rawItems.map((item) => item.product_id);
    const productsData = await hasuraClient.request<{
      Products: Array<{
        id: string;
        ProductName: { name: string; description?: string };
        image: string;
        measurement_unit: string;
        quantity: number;
      }>;
    }>(GET_PRODUCTS_BY_IDS, { ids: productIds });
    const productsMap = productsData.Products.reduce(
      (map, p) => {
        map[p.id] = p;
        return map;
      },
      {} as Record<string, { ProductName: { name: string; description?: string }; image: string; measurement_unit: string; quantity: number }>
    );
    const items = rawItems.map((item) => {
      const prod = productsMap[item.product_id];
      return {
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: prod?.ProductName?.name || "",
        image: prod?.image || "",
        size: prod?.measurement_unit || "",
      };
    });
    const count = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + parseFloat(item.price || "0") * item.quantity,
      0
    );
    return NextResponse.json({
      items,
      count,
      total: totalValue.toString(),
      shopName,
      shopLatitude,
      shopLongitude,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = session.user.id;
  const body = await request.json();
  const { shop_id, product_id, quantity } = body;
  if (!shop_id || !product_id || typeof quantity !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    if (!hasuraClient) throw new Error("Hasura client is not initialized");
    const cartData = await hasuraClient.request<{ Carts: { id: string }[] }>(
      GET_ACTIVE_CART,
      { user_id, shop_id }
    );
    let cart_id = cartData.Carts[0]?.id;
    if (!cart_id) {
      const newCart = await hasuraClient.request<{
        insert_Carts: { returning: { id: string }[] };
      }>(ADD_CART, { user_id, shop_id });
      cart_id = newCart.insert_Carts.returning[0].id;
    }
    const prodData = await hasuraClient.request<{
      Products_by_pk?: { price: string; final_price: string };
    }>(GET_PRODUCT_PRICE, { id: product_id });
    const price = prodData.Products_by_pk?.final_price || "0";
    await hasuraClient.request(ADD_ITEM, {
      cart_id,
      product_id,
      quantity,
      price,
    });
    const itemsData = await hasuraClient.request<{
      Cart_Items: { price: string; quantity: number }[];
    }>(GET_CART_ITEMS, { cart_id });
    const items = itemsData.Cart_Items;
    const count = items.length;
    const totalValue = items.reduce(
      (sum, item) =>
        sum + (parseFloat(item.price) || 0) * (item.quantity || 0),
      0
    );
    await hasuraClient.request(UPDATE_CART_TOTAL, {
      cart_id,
      total: totalValue.toString(),
    });
    return NextResponse.json({ count, total: totalValue.toString() });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { cart_item_id, quantity } = body;
  if (!cart_item_id || typeof quantity !== "number") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  try {
    if (!hasuraClient) throw new Error("Hasura client is not initialized");
    const UPDATE_ITEM = gql`
      mutation UpdateCartItem($id: uuid!, $quantity: Int!) {
        update_Cart_Items_by_pk(
          pk_columns: { id: $id }
          _set: { quantity: $quantity }
        ) {
          id
        }
      }
    `;
    await hasuraClient.request(UPDATE_ITEM, { id: cart_item_id, quantity });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { cart_item_id } = body;
  if (!cart_item_id) {
    return NextResponse.json({ error: "Missing cart_item_id" }, { status: 400 });
  }
  try {
    if (!hasuraClient) throw new Error("Hasura client is not initialized");
    const DELETE_ITEM = gql`
      mutation DeleteCartItem($id: uuid!) {
        delete_Cart_Items_by_pk(id: $id) {
          id
        }
      }
    `;
    await hasuraClient.request(DELETE_ITEM, { id: cart_item_id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 });
  }
}
