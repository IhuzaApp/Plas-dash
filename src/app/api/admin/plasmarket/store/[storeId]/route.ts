import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

const GET_STORE_DETAILS = gql`
  query GetStoreDetails($id: uuid!) {
    business_stores(where: { id: { _eq: $id } }) {
      address
      business_id
      category_id
      created_at
      description
      id
      image
      is_active
      latitude
      longitude
      name
      operating_hours
      businessProductOrders {
        OrderID
        allProducts
        combined_order_id
        comment
        created_at
        delivered_time
        deliveryAddress
        delivery_proof
        id
        latitude
        longitude
        ordered_by
        pin
        service_fee
        shopper_id
        status
        store_id
        timeRange
        total
        transportation_fee
        units
        shopper {
          created_at
          email
          gender
          id
          is_active
          is_guest
          name
          phone
          updated_at
        }
        orderedBy {
          created_at
          email
          gender
          id
          is_active
          is_guest
          name
          password_hash
          phone
          profile_picture
          updated_at
          role
        }
      }
      PlasBusinessProductsOrSerives {
        Description
        Image
        Plasbusiness_id
        category
        created_at
        delveryArea
        enabled
        maxOrders
        minimumOrders
        name
        otherDetails
        price
        query_id
        speciality
        status
        unit
        updated_on
        user_id
        store_id
      }
      Category {
        description
        image
        id
        created_at
        is_active
        name
      }
    }
  }
`;

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
    try {
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

        const { storeId } = params;

        if (!storeId) {
            return NextResponse.json({ error: 'Missing store id' }, { status: 400 });
        }

        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        const result = await hasuraClient.request<any>(GET_STORE_DETAILS, { id: storeId });

        const store = result.business_stores?.[0];

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const formattedStore = {
            id: store.id,
            name: store.name || 'Unnamed Store',
            address: store.address,
            description: store.description,
            image: store.image,
            is_active: store.is_active,
            operating_hours: store.operating_hours,
            created_at: store.created_at,
            category: store.Category ? {
                id: store.Category.id,
                name: store.Category.name,
                image: store.Category.image
            } : null,
            business_id: store.business_id,

            // Raw nested arrays
            products: store.PlasBusinessProductsOrSerives || [],
            orders: store.businessProductOrders || [],

            // Convenient counts
            products_count: store.PlasBusinessProductsOrSerives?.length || 0,
            orders_count: store.businessProductOrders?.length || 0,
        };

        return NextResponse.json({
            success: true,
            store: formattedStore,
        });

    } catch (error: any) {
        console.error('Error fetching PlasMarket store:', error);
        return NextResponse.json({
            error: 'Failed to fetch PlasMarket store',
            message: error.message,
        }, { status: 500 });
    }
}
