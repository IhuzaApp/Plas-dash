import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_ALL_BUSINESS_ORDERS = gql`
  query GetAllBusinessProductOrders($where: businessProductOrders_bool_exp = {}) {
    businessProductOrders(where: $where, order_by: { created_at: desc }) {
      id
      OrderID
      allProducts
      pin
      combined_order_id
      comment
      created_at
      delivered_time
      deliveryAddress
      delivery_proof
      latitude
      longitude
      ordered_by
      service_fee
      shopper_id
      status
      store_id
      timeRange
      total
      transportation_fee
      units
      businessTransactions {
        action
        created_at
        description
        id
        related_order
        status
        type
        wallet_id
      }
      orderedBy {
        id
        name
        email
        phone
        gender
        is_active
        is_guest
        password_hash
        role
        created_at
        profile_picture
      }
      business_store {
        id
        name
        address
        description
        image
        is_active
        latitude
        longitude
        operating_hours
        Category {
          created_at
          description
          id
          image
          is_active
          name
        }
        business_id
        category_id
        created_at
        business_account {
          account_type
          business_email
          business_location
          business_name
          business_phone
          created_at
          face_image
          id
          id_image
          status
        }
      }
      shopper {
        id
        shopper {
          full_name
          Employment_id
          Police_Clearance_Cert
          active
          address
          driving_license
          drivingLicense_Image
          guarantor
          guarantorPhone
          latitude
          longitude
          phone
          phone_number
          status
        }
        updated_at
        vehicle {
          model
          photo
          plate_number
          update_on
          user_id
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
    if (!context.isProjectUser && context.shop_id) {
      where = { store_id: { _eq: context.shop_id } };
    }

    const data = await hasuraClient.request<{
      businessProductOrders: Array<{
        id: string;
        OrderID: string | null;
        allProducts: any;
        total: string;
        service_fee: string;
        units: string;
        status: string | null;
        shopper_id: string | null;
        created_at: string;
        delivered_time: string | null;
        ordered_by: string;
        pin?: string | null;
        combined_order_id?: string | null;
        comment?: string | null;
        deliveryAddress?: string | null;
        delivery_proof?: string | null;
        latitude?: string | null;
        longitude?: string | null;
        store_id?: string | null;
        timeRange?: string | null;
        transportation_fee?: string | null;
        businessTransactions?: Array<{
          action?: string | null;
          created_at: string;
          description?: string | null;
          id: string;
          related_order?: string | null;
          status: string;
          type: string;
          wallet_id: string;
        }>;
        orderedBy: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          gender?: string;
          is_active?: boolean;
          is_guest?: boolean;
          role?: string;
          created_at?: string;
          profile_picture?: string | null;
        } | null;
        business_store: {
          id?: string;
          name?: string;
          address?: string;
          description?: string | null;
          image?: string | null;
          is_active?: boolean;
          latitude?: string | null;
          longitude?: string | null;
          operating_hours?: any;
          Category?: any;
          business_id?: string;
          category_id?: string;
          created_at?: string;
          business_account?: any;
        } | null;
        shopper: {
          id: string;
          name?: string;
          phone?: string;
          email?: string;
          updated_at?: string;
          shopper?: {
            full_name?: string;
            phone_number?: string;
            phone?: string;
            address?: string;
            status?: string;
          } | null;
          vehicle?: any;
        } | null;
      }>;
    }>(GET_ALL_BUSINESS_ORDERS, { where });

    const orders = (data.businessProductOrders || []).map(o => {
      const nested = o.shopper?.shopper;
      return {
        id: o.id,
        OrderID: o.OrderID ?? o.id,
        type: 'business' as const,
        status: o.status ?? 'PENDING',
        total: o.total,
        created_at: o.created_at,
        updated_at: o.created_at,
        ordered_by: o.ordered_by,
        orderedBy: o.orderedBy,
        allProducts: o.allProducts,
        units: o.units,
        business_store: o.business_store,
        shopper_id: o.shopper_id,
        delivery_time: o.delivered_time ?? null,
        pin: o.pin ?? null,
        combined_order_id: o.combined_order_id ?? null,
        comment: o.comment ?? null,
        deliveryAddress: o.deliveryAddress ?? null,
        store_id: o.store_id ?? null,
        timeRange: o.timeRange ?? null,
        transportation_fee: o.transportation_fee ?? null,
        service_fee: o.service_fee ?? null,
        businessTransactions: o.businessTransactions ?? [],
        shopper: o.shopper
          ? {
              id: o.shopper.id,
              name: (o.shopper as any).name ?? nested?.full_name ?? '',
              phone: (o.shopper as any).phone ?? nested?.phone_number ?? nested?.phone ?? '',
              email: (o.shopper as any).email ?? '',
            }
          : undefined,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching business orders', error);
    return NextResponse.json({ error: 'Failed to fetch business orders' }, { status: 500 });
  }
}
