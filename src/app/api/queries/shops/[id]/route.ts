import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
      promotions {
        affects
        applies_to_id
        applies_to_type
        budget_limit
        budget_used
        buy_quantity
        code
        commission_cap
        commission_type
        commission_value
        created_at
        customer_discount_percent
        delivery_paid_by
        discount_type
        discount_value
        end_date
        end_time
        free_delivery
        funded_by
        id
        influencer_code
        influencer_id
        max_discount
        max_platform_loss
        min_order_value
        min_profit_required
        min_purchase_amount
        name
        priority
        promotion_scope
        promotion_type
        restaurant_id
        shop_id
        stacking_type
        start_date
        start_time
        status
        update_on
        usage_limit
        usage_per_customer
        Influencer {
          bank_account_name
          bank_account_number
          bank_name
          contract_end_date
          contract_start_date
          created_at
          description
          email
          id
          membershipId
          momo_number
          name
          payment_method
          payment_terms
          phone
          status
          updated_at
          influencer_commissions {
            affects
            amount
            commission_cap
            commission_type
            created_at
            delivery_paid_by
            free_delivery
            funded_by
            high_value_influencer_bonus
            high_value_order_threshold
            id
            influencer_id
            min_order_value
            order_threshold
          }
        }
      }
      shop_subscription {
        billing_cycle
        business_id
        created_at
        end_date
        id
        plan_id
        restaurant_id
        shop_id
        start_date
        status
        updated_at
        subscription_invoices {
          aiUsage_id
          created_at
          currency
          deleted
          deleted_at
          discount_amount
          due_date
          id
          invoice_number
          is_overdue
          issued_at
          paid_at
          plan_name
          payment_method
          plan_price
          reelUsage_id
          shopSubscription_id
          status
          subtotal_amount
          tax_amount
          updated_at
        }
        subscription_transactions {
          amount
          created_on
          currency
          id
          mtn_response
          phone
          reference_id
          status
          subscription_id
          type
          update_at
          user_id
        }
        plan {
          ai_request_limit
          created_at
          description
          name
          id
          price_monthly
          price_yearly
          reel_limit
          plan_modules {
            id
            plan_id
            module_id
            module {
              created_at
              group_name
              id
              name
              slug
            }
          }
        }
      }
      reel_usages {
        business_id
        id
        month
        restaurant_id
        shop_id
        upload_count
        year
      }
      merchant_wallet {
        active
        balance
        created_at
        id
        restaurant_id
        shop_id
        update_at
      }
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
        Invoices {
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
          reel_order {
            OrderID
            assigned_at
            combined_order_id
            created_at
            delivery_fee
            delivery_note
            delivery_address_id
            delivery_photo_url
            delivery_time
            discount
            found
            id
            quantity
            reel_id
            service_fee
            shopper_id
            status
            total
            updated_at
            user_id
            voucher_code
            pin
          }
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
      orgEmployees {
        id
        fullnames
        Position
        active
        roleType
        email
        phone
      }
    }
    shopCheckouts(where: { shop_id: { _eq: $id } }) {
      total
      tin
      tax
      subtotal
      shop_id
      payment_method
      number
      id
      created_on
      cartItems
      Processed_By
      ProcessedBy {
        Address
        Position
        active
        created_on
        dob
        email
        employeeID
        fullnames
        gender
        phone
      }
      Shops {
        address
        created_at
        description
        has_wallet
        logo
        longitude
        name
        operating_hours
        phone
        rdb_certificate
        tin
        ssd
      }
    }
  }
`;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = _request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) {
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
      shopCheckouts: any[];
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
      shopCheckouts: data.shopCheckouts ?? [],
    };
    return NextResponse.json({ shop });
  } catch (error) {
    console.error('Error fetching shop by id:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}
