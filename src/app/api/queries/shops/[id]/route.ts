import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Single shop by id – full shop detail including Orders with Order_Items, Address, Ratings, Invoice, Delivery_Issues.
const GET_SHOP_BY_ID = gql`
  query GetShopById($id: uuid!) {
    Shops_by_pk(id: $id) {
      id
      name
      description
      address
      phone
      relatedTo
      ssd
      tin
      operating_hours
      latitude
      longitude
      image
      logo
      is_active
      created_at
      updated_at
      category_id
      Category {
        id
        name
      }
      Products {
        id
        productName_id
        price
        final_price
        quantity
        measurement_unit
        supplier
        reorder_point
        is_active
        created_at
        updated_at
        ProductName {
          id
          name
          description
          barcode
          sku
          image
          create_at
        }
        category
      }
      Products_aggregate {
        aggregate {
          count
        }
      }
      Orders_aggregate {
        aggregate {
          count
        }
      }
      Orders(order_by: { created_at: desc }) {
        id
        OrderID
        status
        total
        created_at
        updated_at
        delivery_fee
        service_fee
        orderedBy {
          id
          name
          email
          phone
          password_hash
          profile_picture
        }
        Order_Items {
          id
          quantity
          price
          Product {
            ProductName {
              name
              image
              barcode
              create_at
              description
              id
              sku
            }
            category
            created_at
            final_price
            is_active
            image
            price
            productName_id
            quantity
            reorder_point
            sku
            shop_id
            supplier
            updated_at
            id
            measurement_unit
          }
          created_at
          order_id
          product_id
        }
        Address {
          street
          city
          postal_code
          type
          created_at
          latitude
          longitude
          placeDetails
          is_default
          updated_at
          user_id
        }
        Ratings {
          id
          order_id
          rating
          review
          reviewed_at
          businessProduct_id
          created_at
          customer_id
          delivery_experience
          packaging_quality
          professionalism
          reel_order_id
          shopper_id
          updated_at
        }
        pin
        shop_id
        shopper_id
        user_id
        voucher_code
        delivery_notes
        delivery_photo_url
        delivery_time
        discount
        delivery_address_id
        combined_order_id
        assigned_at
        Invoice {
          Proof
          created_at
          customer_id
          delivery_fee
          discount
          id
          invoice_items
          invoice_number
          order_id
          reel_order_id
          restarurant_order_id
          service_fee
          status
          subtotal
          tax
          total_amount
        }
        Delivery_Issues {
          created_at
          description
          id
          issue_type
          order_id
          priority
          shopper_id
          status
          updated_at
        }
      }
    }
  }
`;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const data = await hasuraClient.request<{
      Shops_by_pk: Record<string, unknown> | null;
    }>(GET_SHOP_BY_ID, { id });
    const raw = data.Shops_by_pk;
    if (!raw) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const r = raw as Record<string, unknown>;
    const shop = {
      ...raw,
      category: r.Category ?? null,
      phone: r.phone ?? null,
      tin: r.tin ?? null,
      ssd: r.ssd ?? null,
      relatedTo: r.relatedTo ?? null,
    };
    return NextResponse.json({ shop });
  } catch (error) {
    console.error('Error fetching shop by id:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}
