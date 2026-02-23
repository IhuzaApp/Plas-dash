import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_ALL_REEL_ORDERS = gql`
  query GetAllReelOrders($where: reel_orders_bool_exp = {}) {
    reel_orders(where: $where, order_by: { created_at: desc }) {
      id
      OrderID
      user_id
      status
      created_at
      updated_at
      total
      delivery_fee
      service_fee
      discount
      voucher_code
      shopper_id
      delivery_time
      delivery_address_id
      delivery_photo_url
      delivery_note
      combined_order_id
      quantity
      reel_id
      found
      User {
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
        latitude
        longitude
        is_default
        id
        created_at
        updated_at
        user_id
      }
      Reel {
        id
        Price
        Product
        category
        created_on
        delivery_time
        description
        title
        type
        user_id
        video_url
        shop_id
        restaurant_id
        Shops {
          id
          name
          image
          address
          description
          latitude
          longitude
        }
      }
      Shoppers {
        id
        name
        phone
        email
        profile_picture
        shopper {
          full_name
          phone_number
        }
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
    if (!context.isProjectUser) {
      const conditions: any[] = [];
      if (context.shop_id) {
        conditions.push({ Reel: { shop_id: { _eq: context.shop_id } } });
      }
      if (context.restaurant_id) {
        conditions.push({ Reel: { restaurant_id: { _eq: context.restaurant_id } } });
      }

      if (conditions.length > 0) {
        where = conditions.length === 1 ? conditions[0] : { _or: conditions };
      } else {
        // Non-admin with no associations sees nothing
        where = { id: { _eq: '00000000-0000-0000-0000-000000000000' } };
      }
    }

    const data = await hasuraClient.request<{
      reel_orders: Array<{
        id: string;
        OrderID: string | number | null;
        user_id: string;
        status: string;
        created_at: string;
        updated_at: string | null;
        total: string;
        delivery_fee?: string | null;
        service_fee?: string | null;
        discount?: string | null;
        voucher_code?: string | null;
        shopper_id: string | null;
        delivery_time: string | null;
        delivery_address_id?: string | null;
        delivery_photo_url?: string | null;
        delivery_note?: string | null;
        combined_order_id?: string | null;
        quantity?: number | null;
        reel_id?: string | null;
        found?: boolean | null;
        User: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          profile_picture?: string | null;
        } | null;
        Address: {
          street: string;
          city: string;
          postal_code: string;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean | null;
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        } | null;
        Reel: {
          id: string;
          Price: string | null;
          Product: any;
          category?: string | null;
          created_on?: string;
          delivery_time?: string | null;
          description?: string | null;
          title?: string | null;
          type?: string | null;
          user_id?: string;
          video_url?: string | null;
          shop_id?: string | null;
          restaurant_id?: string | null;
          Shops?: {
            id: string;
            name: string;
            image?: string | null;
            address?: string | null;
            description?: string | null;
            latitude?: number | null;
            longitude?: number | null;
          } | null;
        } | null;
        Shoppers: {
          id: string;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          profile_picture?: string | null;
          shopper?: { full_name?: string; phone_number?: string } | null;
        } | null;
      }>;
    }>(GET_ALL_REEL_ORDERS, { where });

    const orders = (data.reel_orders || []).map(o => ({
      id: o.id,
      OrderID: o.OrderID != null ? String(o.OrderID) : o.id,
      type: 'reel' as const,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
      updated_at: o.updated_at ?? o.created_at,
      user_id: o.user_id,
      delivery_fee: o.delivery_fee ?? undefined,
      service_fee: o.service_fee ?? undefined,
      discount: o.discount ?? undefined,
      voucher_code: o.voucher_code ?? undefined,
      shopper_id: o.shopper_id,
      delivery_time: o.delivery_time ?? undefined,
      delivery_address_id: o.delivery_address_id ?? undefined,
      delivery_photo_url: o.delivery_photo_url ?? undefined,
      delivery_note: o.delivery_note ?? undefined,
      combined_order_id: o.combined_order_id ?? undefined,
      quantity: o.quantity ?? undefined,
      reel_id: o.reel_id ?? undefined,
      found: o.found ?? undefined,
      User: o.User,
      Address: o.Address,
      Reel: o.Reel,
      Shoppers: o.Shoppers,
      Shop: o.Reel?.Shops
        ? {
          id: o.Reel.Shops.id,
          name: o.Reel.Shops.name,
          address: o.Reel.Shops.address ?? undefined,
          image: o.Reel.Shops.image ?? undefined,
        }
        : undefined,
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching reel orders', error);
    return NextResponse.json({ error: 'Failed to fetch reel orders' }, { status: 500 });
  }
}
