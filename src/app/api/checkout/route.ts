import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { notifyNewOrderToSlack } from '@/lib/slackOrderNotifier';

interface CartItem {
  product_id: string;
  quantity: number;
  price: string;
  Product: { price: string; final_price: string };
}
interface Cart {
  id: string;
  Cart_Items: CartItem[];
  Shop?: { id: string; name: string } | null;
}

const GET_CART_WITH_ITEMS = gql`
  query GetCartWithItems($user_id: uuid!, $shop_id: uuid!) {
    Carts(
      where: { user_id: { _eq: $user_id }, shop_id: { _eq: $shop_id }, is_active: { _eq: true } }
      limit: 1
    ) {
      id
      Cart_Items {
        product_id
        quantity
        price
        Product {
          price
          final_price
        }
      }
      Shop {
        id
        name
      }
    }
  }
`;

const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds($ids: [uuid!]!) {
    Products(where: { id: { _in: $ids } }) {
      id
      quantity
    }
  }
`;

function generateOrderPin(): string {
  return Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
}

const GET_ADDRESS_AND_USER = gql`
  query GetAddressAndUser($address_id: uuid!) {
    Addresses_by_pk(id: $address_id) {
      street
      city
      postal_code
      User {
        name
        email
        phone
      }
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder(
    $user_id: uuid!
    $shop_id: uuid!
    $delivery_address_id: uuid!
    $total: String!
    $status: String!
    $service_fee: String!
    $delivery_fee: String!
    $discount: String
    $voucher_code: String
    $delivery_time: timestamptz!
    $delivery_notes: String
    $pin: String!
  ) {
    insert_Orders_one(
      object: {
        user_id: $user_id
        shop_id: $shop_id
        delivery_address_id: $delivery_address_id
        total: $total
        status: $status
        service_fee: $service_fee
        delivery_fee: $delivery_fee
        discount: $discount
        voucher_code: $voucher_code
        shopper_id: null
        delivery_time: $delivery_time
        delivery_notes: $delivery_notes
        pin: $pin
      }
    ) {
      id
      OrderID
      pin
    }
  }
`;

const CREATE_ORDER_ITEMS = gql`
  mutation CreateOrderItems($objects: [Order_Items_insert_input!]!) {
    insert_Order_Items(objects: $objects) {
      affected_rows
    }
  }
`;

const DELETE_CART_ITEMS = gql`
  mutation DeleteCartItems($cart_id: uuid!) {
    delete_Cart_Items(where: { cart_id: { _eq: $cart_id } }) {
      affected_rows
    }
  }
`;

const DELETE_CART = gql`
  mutation DeleteCart($cart_id: uuid!) {
    delete_Carts_by_pk(id: $cart_id) {
      id
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user_id = session.user.id;
  const body = await request.json();
  const {
    shop_id,
    delivery_address_id,
    service_fee,
    delivery_fee,
    discount,
    voucher_code,
    delivery_time,
    delivery_notes,
  } = body;
  if (!shop_id || !delivery_address_id || !service_fee || !delivery_fee || !delivery_time) {
    return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 });
  }
  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const cartData = await hasuraClient.request<{ Carts: Cart[] }>(GET_CART_WITH_ITEMS, {
      user_id,
      shop_id,
    });
    const cart = cartData.Carts[0];
    if (!cart) {
      return NextResponse.json({ error: 'No active cart found for this shop.' }, { status: 400 });
    }
    const items = cart.Cart_Items;
    if (items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }
    const productIds = items.map(i => i.product_id);
    const prodData = await hasuraClient.request<{
      Products: Array<{ id: string; quantity: number }>;
    }>(GET_PRODUCTS_BY_IDS, { ids: productIds });
    const stockMap = new Map(prodData.Products.map(p => [p.id, p.quantity]));
    for (const item of items) {
      const available = stockMap.get(item.product_id);
      if (available === undefined) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found.` },
          { status: 400 }
        );
      }
      if (item.quantity > available) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product ${item.product_id}.`,
          },
          { status: 400 }
        );
      }
    }
    const actualTotal = items.reduce((sum, item) => {
      const price = parseFloat(item.Product.price);
      return sum + price * item.quantity;
    }, 0);
    const orderPin = generateOrderPin();
    const orderRes = await hasuraClient.request<{
      insert_Orders_one: { id: string; OrderID?: string; pin: string };
    }>(CREATE_ORDER, {
      user_id,
      shop_id,
      delivery_address_id,
      total: actualTotal.toFixed(2),
      status: 'PENDING',
      service_fee,
      delivery_fee,
      discount: discount ?? null,
      voucher_code: voucher_code ?? null,
      delivery_time,
      delivery_notes: delivery_notes ?? null,
      pin: orderPin,
    });
    const orderId = orderRes.insert_Orders_one.id;
    const orderItems = items.map(i => ({
      order_id: orderId,
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.Product.price,
    }));
    await hasuraClient.request(CREATE_ORDER_ITEMS, { objects: orderItems });
    await hasuraClient.request(DELETE_CART_ITEMS, { cart_id: cart.id });
    await hasuraClient.request(DELETE_CART, { cart_id: cart.id });
    const orderTotal =
      actualTotal + parseFloat(service_fee || '0') + parseFloat(delivery_fee || '0');
    const units = items.reduce((sum, i) => sum + i.quantity, 0);
    const orderID = orderRes.insert_Orders_one.OrderID;
    const storeName = cart.Shop?.name;
    let customerAddress: string | undefined;
    let customerPhone: string | undefined;
    let customerName: string | undefined;
    try {
      const aux = await hasuraClient.request<{
        Addresses_by_pk: {
          street: string;
          city: string;
          postal_code: string;
          User: {
            name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
        } | null;
      }>(GET_ADDRESS_AND_USER, { address_id: delivery_address_id });
      if (aux.Addresses_by_pk) {
        const a = aux.Addresses_by_pk;
        customerAddress = [a.street, a.city, a.postal_code].filter(Boolean).join(', ');
        customerName = a.User?.name ?? undefined;
        customerPhone = a.User?.phone ?? undefined;
      }
    } catch {
      // non-blocking
    }
    void notifyNewOrderToSlack({
      id: orderId,
      orderID: orderID ?? orderId,
      total: orderTotal,
      orderType: 'regular',
      storeName,
      units,
      customerName,
      customerPhone,
      customerAddress,
      deliveryTime: delivery_time,
    });
    return NextResponse.json(
      {
        order_id: orderId,
        pin: orderRes.insert_Orders_one.pin,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err?.message || 'Checkout failed' }, { status: 500 });
  }
}
