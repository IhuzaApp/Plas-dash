import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

// Admin dashboard: fetches all orders with customer (orderedBy), address, items, and shopper (Shoppers).
const GET_ORDERS = gql`
  query GetOrders($where: Orders_bool_exp = {}) {
    Orders(where: $where, order_by: { created_at: desc }) {
      id
      OrderID
      user_id
      status
      created_at
      updated_at
      total
      service_fee
      delivery_fee
      shop_id
      shopper_id
      delivery_time
      delivery_address_id
      delivery_notes
      combined_order_id
      discount
      voucher_code
      orderedBy {
        id
        name
        email
        phone
        profile_picture
      }
      Address {
        street
        city
        postal_code
      }
      Order_Items {
        id
        product_id
        quantity
        price
      }
      Order_Items_aggregate {
        aggregate {
          count
          sum {
            quantity
          }
        }
      }
      shoppers {
        id
        full_name
        phone_number
      }
      Shop {
        id
        name
        address
        image
      }
      Wallet_Transactions {
        amount
        created_at
        currency
        description
        id
        mtn_response
        petAdoptionId
        phone
        reference_id
        relate_business_order_id
        related_order_id
        related_reel_orderId
        related_restaurant_order_id
        status
        type
        vehicleBookingsId
        wallet_id
      }
      order_transactions {
        amount
        business_order_id
        created_at
        currency
        id
        mtn_response
        order_id
        package_id
        petAdoptionId
        phone
        reel_order_id
        reference_id
        restaurant_order_id
        status
        type
        updated_at
        user_id
        vehicleBookingsId
        wallet_id
      }
    }
  }
`;

export async function GET(req: Request) {
  const context = await getUserContext(req);

  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    let where: any = {};
    if (!context.isProjectUser && context.shop_id) {
      where = { shop_id: { _eq: context.shop_id } };
    }

    const data = await hasuraClient.request<{
      Orders: Array<{
        id: string;
        OrderID: string;
        user_id: string;
        status: string;
        created_at: string;
        updated_at: string;
        total: string;
        service_fee: string;
        delivery_fee: string;
        shop_id: string;
        shopper_id: string | null;
        delivery_time: string;
        delivery_address_id?: string;
        delivery_notes?: string;
        combined_order_id?: string | null;
        discount?: string;
        voucher_code?: string | null;
        orderedBy?: { id?: string; name?: string; email?: string; phone?: string } | null;
        Address?: { street: string; city: string; postal_code: string } | null;
        Order_Items?: Array<{ id: string; product_id: string; quantity: number; price: string }>;
        Order_Items_aggregate?: {
          aggregate: {
            count: number;
            sum: { quantity: number | null } | null;
          } | null;
        };
        shoppers?: {
          id?: string;
          full_name?: string;
          phone_number?: string;
        };
        Shop?: { id?: string; name?: string; address?: string; image?: string } | null;
      }>;
    }>(GET_ORDERS, { where });
    const orders = data.Orders || [];

    if (orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const enriched = orders.map(o => {
      const agg = o.Order_Items_aggregate?.aggregate;
      const itemsCount = agg?.count ?? o.Order_Items?.length ?? 0;
      const unitsCount =
        agg?.sum?.quantity ?? o.Order_Items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;
      const baseTotal = parseFloat(o.total || '0');
      const serviceFee = parseFloat(o.service_fee || '0');
      const deliveryFee = parseFloat(o.delivery_fee || '0');

      const grandTotal = baseTotal + serviceFee + deliveryFee;
      return {
        id: o.id,
        OrderID: o.OrderID,
        user_id: o.user_id,
        status: o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
        delivery_time: o.delivery_time,
        delivery_address_id: o.delivery_address_id,
        delivery_notes: o.delivery_notes,
        combined_order_id: o.combined_order_id,
        discount: o.discount,
        voucher_code: o.voucher_code,
        total: grandTotal.toString(),
        service_fee: o.service_fee?.toString() || '0',
        delivery_fee: o.delivery_fee?.toString() || '0',
        shop_id: o.shop_id,
        shopper_id: o.shopper_id,
        shop: o.Shop ?? null,
        User: o.orderedBy ?? undefined,
        Address: o.Address ?? undefined,
        Order_Items: o.Order_Items ?? [],
        shopper:
          o.shoppers != null
            ? {
                id: o.shoppers.id ?? '',
                name: o.shoppers.full_name ?? '',
                phone: o.shoppers.phone_number ?? '',
                email: '',
              }
            : undefined,
        itemsCount,
        unitsCount,
        Wallet_Transactions: o.Wallet_Transactions ?? [],
        order_transactions: o.order_transactions ?? [],
      };
    });

    return NextResponse.json({ orders: enriched });
  } catch (error) {
    console.error('Error fetching orders', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
