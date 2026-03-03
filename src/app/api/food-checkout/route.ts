import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { notifyNewOrderToSlack } from '@/lib/slackOrderNotifier';

function generateOrderPin(): string {
  return Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
}

const CREATE_FOOD_ORDER = gql`
  mutation CreateFoodOrder(
    $user_id: uuid!
    $restaurant_id: uuid!
    $delivery_address_id: uuid!
    $total: String!
    $delivery_fee: String!
    $discount: String
    $voucher_code: String
    $delivery_time: String!
    $delivery_notes: String
    $pin: String!
    $status: String = "WAITING_FOR_CONFIRMATION"
  ) {
    insert_restaurant_orders(
      objects: {
        user_id: $user_id
        restaurant_id: $restaurant_id
        delivery_address_id: $delivery_address_id
        total: $total
        delivery_fee: $delivery_fee
        discount: $discount
        voucher_code: $voucher_code
        delivery_time: $delivery_time
        delivery_notes: $delivery_notes
        pin: $pin
        status: $status
        shopper_id: null
      }
    ) {
      affected_rows
      returning {
        id
        OrderID
        total
        status
        created_at
        delivery_time
        pin
      }
    }
  }
`;

const GET_RESTAURANT_ADDRESS_USER = gql`
  query GetRestaurantAddressUser($restaurant_id: uuid!, $address_id: uuid!, $user_id: uuid!) {
    Restaurants_by_pk(id: $restaurant_id) {
      name
    }
    Addresses_by_pk(id: $address_id) {
      street
      city
      postal_code
    }
    User_by_pk(id: $user_id) {
      phone
    }
  }
`;

const ADD_DISHES_TO_ORDER = gql`
  mutation AddDishesToOrder(
    $order_id: uuid!
    $dish_id: uuid!
    $quantity: String!
    $price: String!
  ) {
    insert_restaurant_order_items(
      objects: { order_id: $order_id, dish_id: $dish_id, quantity: $quantity, price: $price }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

interface FoodCheckoutRequest {
  restaurant_id: string;
  delivery_address_id: string;
  service_fee?: string;
  delivery_fee: string;
  discount?: string | null;
  voucher_code?: string | null;
  delivery_time: string;
  delivery_notes?: string | null;
  items: Array<{
    dish_id: string;
    quantity: number;
    price: string;
    discount?: string | null;
  }>;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!(session as any)?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) as FoodCheckoutRequest;
    const {
      restaurant_id,
      delivery_address_id,
      delivery_fee,
      discount,
      voucher_code,
      delivery_time,
      delivery_notes,
      items,
    } = body;
    if (!restaurant_id || !delivery_address_id || !items || items.length === 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields: restaurant_id, delivery_address_id, and items',
        },
        { status: 400 }
      );
    }
    let subtotal = 0;
    items.forEach(item => {
      let price = parseFloat(item.price);
      if (item.discount && item.discount !== '0' && item.discount !== '0%') {
        if (item.discount.includes('%')) {
          const discountPercent = parseFloat(item.discount.replace('%', ''));
          price = price * (1 - discountPercent / 100);
        } else {
          price = Math.max(0, price - parseFloat(item.discount));
        }
      }
      subtotal += price * item.quantity;
    });
    const deliveryFeeAmount = parseFloat(delivery_fee);
    const discountAmount = discount ? parseFloat(discount) : 0;
    const totalAmount = subtotal + deliveryFeeAmount - discountAmount;
    if (!hasuraClient) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    const orderPin = generateOrderPin();
    const orderResponse = (await hasuraClient.request(CREATE_FOOD_ORDER, {
      user_id: (session as any)?.user?.id,
      restaurant_id,
      delivery_address_id,
      total: totalAmount.toString(),
      delivery_fee,
      discount: discount || null,
      voucher_code: voucher_code || null,
      delivery_time,
      delivery_notes: delivery_notes || null,
      pin: orderPin,
    })) as any;
    if (
      !orderResponse.insert_restaurant_orders ||
      orderResponse.insert_restaurant_orders.affected_rows === 0
    ) {
      return NextResponse.json({ error: 'Failed to create food order' }, { status: 500 });
    }
    const createdOrder = orderResponse.insert_restaurant_orders.returning[0];
    const orderId = createdOrder.id;
    const dishPromises = items.map(item =>
      hasuraClient!.request(ADD_DISHES_TO_ORDER, {
        order_id: orderId,
        dish_id: item.dish_id,
        quantity: item.quantity.toString(),
        price: item.price,
      })
    );
    const dishResults = (await Promise.all(dishPromises)) as any[];
    const totalDishesAdded = dishResults.reduce(
      (sum, result) => sum + result.insert_restaurant_order_items.affected_rows,
      0
    );
    if (totalDishesAdded !== items.length) {
      console.error('Not all dishes were added to the order');
    }
    let storeName: string | undefined;
    let customerAddress: string | undefined;
    let customerPhone: string | undefined;
    try {
      const aux = await hasuraClient.request<{
        Restaurants_by_pk: { name: string } | null;
        Addresses_by_pk: {
          street: string;
          city: string;
          postal_code: string;
        } | null;
        User_by_pk: { phone: string | null } | null;
      }>(GET_RESTAURANT_ADDRESS_USER, {
        restaurant_id,
        address_id: delivery_address_id,
        user_id: (session as any)?.user?.id,
      });
      storeName = aux.Restaurants_by_pk?.name;
      if (aux.Addresses_by_pk) {
        const a = aux.Addresses_by_pk;
        customerAddress = [a.street, a.city, a.postal_code].filter(Boolean).join(', ');
      }
      customerPhone = aux.User_by_pk?.phone ?? undefined;
    } catch {
      // non-blocking
    }
    void notifyNewOrderToSlack({
      id: orderId,
      orderID: createdOrder.OrderID ?? orderId,
      total: totalAmount,
      orderType: 'restaurant',
      storeName,
      units: totalDishesAdded,
      customerPhone,
      customerAddress,
      deliveryTime: createdOrder.delivery_time,
    });
    return NextResponse.json({
      success: true,
      order_id: createdOrder.id,
      order_number: createdOrder.OrderID,
      pin: createdOrder.pin,
      message: 'Food order created successfully',
      total_amount: totalAmount,
      delivery_time: createdOrder.delivery_time,
      dishes_added: totalDishesAdded,
    });
  } catch (error) {
    console.error('Food checkout error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
