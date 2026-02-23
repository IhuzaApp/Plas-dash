import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_RESTAURANT_ORDERS = gql`
  query GetAllRestaurantOrders {
    restaurant_orders(order_by: { created_at: desc }) {
      id
      OrderID
      user_id
      status
      created_at
      updated_at
      total
      delivery_fee
      restaurant_id
      shopper_id
      delivery_time
      delivery_notes
      pin
      orderedBy {
        id
        name
        email
        phone
        gender
        is_active
      }
      Address {
        street
        city
        postal_code
        latitude
        is_default
        id
        created_at
        placeDetails
        longitude
        type
        updated_at
        user_id
      }
      Restaurant {
        id
        name
        logo
        phone
        verified
        ussd
        tin
        profile
        relatedTo
        long
        location
        lat
        is_active
        email
        created_at
      }
      restaurant_order_items_aggregate {
        aggregate {
          count
        }
      }
      restaurant_order_items {
        id
        quantity
        price
        dish_id
        created_at
        order_id
        restaurant_dishes {
          SKU
          created_at
          discount
          dish_id
          id
          is_active
          product_id
          price
          preparingTime
          promo
          promo_type
          quantity
          restaurant_id
          updated_at
          dishes {
            category
            created_at
            id
            image
            ingredients
            name
            update_at
          }
        }
      }
      shopper {
        id
        name
        shopper {
          full_name
          phone_number
          Employment_id
          Police_Clearance_Cert
          active
          address
          drivingLicense_Image
          driving_license
          guarantorPhone
          guarantor
          phone
          signature
          profile_photo
          updated_at
        }
        updated_at
        vehicle {
          model
          photo
          plate_number
          type
          id
        }
      }
      discount
      found
      delivery_address_id
      combined_order_id
      assigned_at
      delivery_photo_url
      voucher_code
      Wallet_Transactions {
        amount
        created_at
        description
        id
        relate_business_order_id
        related_order_id
        related_reel_orderId
        related_restaurant_order_id
        status
        type
        wallet_id
      }
    }
  }
`;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    type RestaurantOrderItem = {
      id: string;
      quantity: number;
      price: string;
      dish_id: string;
      created_at?: string;
      order_id?: string;
      restaurant_dishes?: {
        SKU?: string;
        created_at?: string;
        discount?: string;
        dish_id?: string;
        id: string;
        is_active?: boolean;
        product_id?: string;
        price?: string;
        preparingTime?: number;
        promo?: string;
        promo_type?: string;
        quantity?: number;
        restaurant_id?: string;
        updated_at?: string;
        dishes?: {
          category?: string;
          created_at?: string;
          id: string;
          image?: string;
          ingredients?: string;
          name?: string;
          update_at?: string;
        } | null;
      } | null;
    };

    const data = await hasuraClient.request<{
      restaurant_orders: Array<{
        id: string;
        OrderID: string | number | null;
        user_id: string;
        status: string;
        created_at: string;
        updated_at: string | null;
        total: string;
        delivery_fee: string;
        restaurant_id: string;
        shopper_id: string | null;
        delivery_time: string | null;
        delivery_notes: string | null;
        pin: string | null;
        discount?: string | null;
        found?: boolean | null;
        delivery_address_id?: string | null;
        combined_order_id?: string | null;
        assigned_at?: string | null;
        delivery_photo_url?: string | null;
        voucher_code?: string | null;
        Wallet_Transactions?: Array<{
          amount: string;
          created_at: string;
          description?: string | null;
          id: string;
          relate_business_order_id?: string | null;
          related_order_id?: string | null;
          related_reel_orderId?: string | null;
          related_restaurant_order_id?: string | null;
          status: string;
          type: string;
          wallet_id: string;
        }>;
        orderedBy: {
          id: string;
          name: string;
          email: string;
          phone: string;
          gender?: string | null;
          is_active?: boolean | null;
        } | null;
        Address: {
          street: string;
          city: string;
          postal_code: string;
          latitude?: number | null;
          is_default?: boolean | null;
          id?: string;
          created_at?: string;
          placeDetails?: string | null;
          longitude?: number | null;
          type?: string | null;
          updated_at?: string;
          user_id?: string;
        } | null;
        Restaurant: {
          id: string;
          name: string;
          logo: string | null;
          phone: string | null;
          verified?: boolean | null;
          ussd?: string | null;
          tin?: string | null;
          profile?: string | null;
          relatedTo?: string | null;
          long?: number | null;
          location?: string | null;
          lat?: number | null;
          is_active?: boolean | null;
          email?: string | null;
          created_at?: string;
        } | null;
        restaurant_order_items_aggregate?: {
          aggregate: { count: number } | null;
        };
        restaurant_order_items: RestaurantOrderItem[];
        shopper: {
          id: string;
          name?: string;
          updated_at?: string;
          shopper?: {
            full_name?: string;
            phone_number?: string;
            Employment_id?: string;
            Police_Clearance_Cert?: string;
            active?: boolean;
            address?: string;
            drivingLicense_Image?: string;
            driving_license?: string;
            guarantorPhone?: string;
            guarantor?: string;
            phone?: string;
            signature?: string;
            profile_photo?: string;
            updated_at?: string;
          } | null;
          vehicle?: {
            model?: string;
            photo?: string;
            plate_number?: string;
            type?: string;
            id?: string;
          } | null;
        } | null;
      }>;
    }>(GET_ALL_RESTAURANT_ORDERS);

    const orders = (data.restaurant_orders || []).map(o => {
      const itemsCount =
        o.restaurant_order_items_aggregate?.aggregate?.count ??
        o.restaurant_order_items?.length ??
        0;
      const unitsCount =
        o.restaurant_order_items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) ?? 0;
      return {
        id: o.id,
        OrderID: o.OrderID != null ? String(o.OrderID) : o.id,
        type: 'restaurant' as const,
        status: o.status,
        total: o.total,
        created_at: o.created_at,
        updated_at: o.updated_at ?? o.created_at,
        user_id: o.user_id,
        delivery_fee: o.delivery_fee,
        delivery_time: o.delivery_time,
        delivery_notes: o.delivery_notes,
        pin: o.pin,
        discount: o.discount ?? undefined,
        found: o.found ?? undefined,
        delivery_address_id: o.delivery_address_id ?? undefined,
        combined_order_id: o.combined_order_id ?? undefined,
        assigned_at: o.assigned_at ?? undefined,
        delivery_photo_url: o.delivery_photo_url ?? undefined,
        voucher_code: o.voucher_code ?? undefined,
        Wallet_Transactions: o.Wallet_Transactions ?? [],
        orderedBy: o.orderedBy,
        Address: o.Address,
        Restaurant: o.Restaurant,
        restaurant_order_items: o.restaurant_order_items,
        itemsCount,
        unitsCount,
        shopper_id: o.shopper_id,
        shopper:
          o.shopper != null
            ? {
                id: o.shopper.id,
                name: o.shopper.name ?? o.shopper.shopper?.full_name ?? '',
                phone: o.shopper.shopper?.phone_number ?? o.shopper.shopper?.phone ?? '',
                email: '',
                shopper: o.shopper.shopper,
                vehicle: o.shopper.vehicle,
                updated_at: o.shopper.updated_at,
              }
            : undefined,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching restaurant orders', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant orders' }, { status: 500 });
  }
}
