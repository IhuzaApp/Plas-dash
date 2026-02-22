import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Admin dashboard: full shopper list from getShopperInformation.graphql
const GET_SHOPPERS = gql`
  query getShopperInformation {
    shoppers(order_by: { created_at: desc }) {
      Employment_id
      address
      background_check_completed
      created_at
      driving_license
      full_name
      id
      national_id
      onboarding_step
      phone_number
      profile_photo
      status
      transport_mode
      updated_at
      user_id
      active
      phone
      needCollection
      national_id_photo_front
      national_id_photo_back
      mutual_status
      longitude
      mutual_StatusCertificate
      latitude
      proofOfResidency
      signature
      telegram_id
      drivingLicense_Image
      collection_comment
      guarantor
      guarantorPhone
      guarantorRelationship
      Police_Clearance_Cert
      User {
        gender
      }
    }
  }
`;

// Single shopper by user_id + Orders in one request (for /shoppers/[id])
const GET_SHOPPER_BY_USER_ID = gql`
  query GetShoppersByUser_id($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      Employment_id
      address
      background_check_completed
      created_at
      driving_license
      full_name
      id
      national_id
      onboarding_step
      phone_number
      profile_photo
      status
      transport_mode
      updated_at
      user_id
      active
      phone
      needCollection
      national_id_photo_front
      national_id_photo_back
      mutual_status
      longitude
      mutual_StatusCertificate
      latitude
      proofOfResidency
      signature
      telegram_id
      drivingLicense_Image
      collection_comment
      guarantor
      guarantorPhone
      guarantorRelationship
      Police_Clearance_Cert
      User {
        id
        email
        is_active
        created_at
        gender
        name
        password_hash
        phone
        profile_picture
        updated_at
        role
        Ratings {
          created_at
          customer_id
          delivery_experience
          id
          order_id
          packaging_quality
          professionalism
          rating
          reel_order_id
          review
          reviewed_at
          shopper_id
          updated_at
          businessProduct_id
        }
        tickets {
          created_on
          id
          other_user_id
          priority
          status
          subject
          ticket_num
          update_on
          user_id
          category
        }
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
        Payment_Methods {
          CCV
          create_at
          id
          is_default
          method
          names
          number
          update_on
          user_id
          validity
        }
        Wallets {
          available_balance
          id
          last_updated
          reserved_balance
          shopper_id
          Wallet_Transactions {
            id
            amount
            type
            status
            created_at
            related_order_id
            Order {
              OrderID
              status
            }
          }
        }
      }
      Revenues {
        amount
        commission_percentage
        created_at
        id
        order_id
        products
        shop_id
        shopper_id
        type
        Plasbusiness_id
        businessOrder_Id
        reel_order_id
        restaurant_id
        restaurant_order_id
      }
    }
    Orders(where: { shopper_id: { _eq: $user_id } }, order_by: { created_at: desc }) {
      id
      OrderID
      status
      total
      created_at
      updated_at
      delivery_time
      delivery_fee
      service_fee
      discount
      delivery_notes
      delivery_photo_url
      orderedBy {
        name
      }
      Shop {
        id
        name
      }
      Address {
        street
        city
        postal_code
      }
    }
    reel_orders(where: { shopper_id: { _eq: $user_id } }, order_by: { created_at: desc }) {
      id
      OrderID
      created_at
      updated_at
      status
      total
      delivery_fee
      service_fee
      User {
        name
      }
      Reel {
        title
        Shops {
          name
        }
      }
    }
    businessProductOrders(
      where: { shopper_id: { _eq: $user_id } }
      order_by: { created_at: desc }
    ) {
      id
      OrderID
      created_at
      status
      total
      service_fee
      transportation_fee
      orderedBy {
        name
      }
      business_store {
        name
      }
    }
    restaurant_orders(where: { shopper_id: { _eq: $user_id } }, order_by: { created_at: desc }) {
      id
      OrderID
      created_at
      updated_at
      status
      total
      delivery_fee
      orderedBy {
        name
      }
      Restaurant {
        name
      }
    }
  }
`;

// Withdraw requests by shopper_id (with verification_image and Wallets for proof + balance)
const GET_WITHDRAW_REQUESTS = gql`
  query GetWithdrawRequestsByShopper($shopper_id: uuid!) {
    withDraweRequest(where: { shopper_id: { _eq: $shopper_id } }, order_by: { update_at: desc }) {
      id
      amount
      status
      update_at
      created_at
      phoneNumber
      shopper_id
      shopperWallet_id
      verification_image
      Wallets {
        id
        available_balance
        reserved_balance
        last_updated
        shopper_id
      }
    }
  }
`;

// Full Revenue list for shopper (regular, reel, business, restaurant) with Order, Shop, reel_orders, restaurant_orders
const GET_REVENUE_BY_SHOPPER = gql`
  query GetRevenueByShopper($shopper_id: uuid!) {
    Revenue(where: { shopper_id: { _eq: $shopper_id } }, order_by: { created_at: desc }) {
      id
      amount
      businessOrder_Id
      commission_percentage
      created_at
      order_id
      products
      reel_order_id
      restaurant_id
      restaurant_order_id
      shop_id
      shopper_id
      type
      Plasbusiness_id
      Order {
        id
        OrderID
        delivery_address_id
        created_at
        assigned_at
        combined_order_id
        pin
        service_fee
        shop_id
        shopper_id
        status
        total
        voucher_code
        user_id
        updated_at
        discount
        delivery_time
        delivery_photo_url
        delivery_notes
        delivery_fee
      }
      Shop {
        id
        name
        address
        category_id
        description
        logo
        image
        latitude
        longitude
        phone
        operating_hours
        is_active
      }
      Restaurants {
        id
        name
        logo
        email
        location
        lat
        long
        created_at
      }
      reel_orders {
        id
        OrderID
        assigned_at
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_note
        delivery_time
        discount
        found
      }
      restaurant_orders {
        id
        OrderID
        assigned_at
        combined_order_id
        delivery_time
        delivery_photo_url
        delivery_notes
        delivery_fee
        delivery_address_id
        found
        discount
        pin
        restaurant_id
        shopper_id
        status
        voucher_code
      }
      businessProductOrders {
        id
        OrderID
      }
    }
  }
`;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
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
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    if (user_id) {
      const data = await hasuraClient.request<{
        shoppers: any[];
        Orders?: any[];
        reel_orders?: any[];
        businessProductOrders?: any[];
        restaurant_orders?: any[];
      }>(GET_SHOPPER_BY_USER_ID, { user_id });
      const shoppers = data.shoppers || [];
      const orders = data.Orders || [];
      const reelOrders = data.reel_orders || [];
      const businessOrders = data.businessProductOrders || [];
      const restaurantOrders = data.restaurant_orders || [];
      const shopper = shoppers[0];
      if (!shopper) {
        return NextResponse.json({
          shoppers: [],
          Orders: [],
          reel_orders: [],
          businessProductOrders: [],
          restaurant_orders: [],
          summary: null,
          withdraw_requests: [],
          revenues: [],
        });
      }
      let withdrawRequests: any[] = [];
      try {
        const withdrawData = await hasuraClient.request<{
          withDraweRequest?: any[];
        }>(GET_WITHDRAW_REQUESTS, { shopper_id: shopper.id });
        withdrawRequests = withdrawData.withDraweRequest || [];
      } catch (_) {
        // Withdraw table/query may not exist in all environments
      }
      let revenues: any[] = [];
      try {
        const revenueData = await hasuraClient.request<{
          Revenue?: any[];
        }>(GET_REVENUE_BY_SHOPPER, { shopper_id: shopper.id });
        revenues = revenueData.Revenue || [];
      } catch (_) {
        // Fallback to nested Revenues if root Revenue query fails (e.g. different schema)
        revenues = shopper.Revenues || [];
      }
      const wallet = shopper.User?.Wallets?.[0];
      const ratings = shopper.User?.Ratings || [];

      const pendingWithdrawAmount = withdrawRequests
        .filter((w: any) => (w.status || '').toLowerCase() === 'pending')
        .reduce((sum: number, w: any) => sum + parseFloat(w.amount || '0'), 0);

      const sumOrderFees = (list: any[], deliveryKey: string, serviceKey: string) =>
        list.reduce(
          (sum, o) => sum + parseFloat(o[deliveryKey] || '0') + parseFloat(o[serviceKey] || '0'),
          0
        );

      const revenueRegular = sumOrderFees(orders, 'delivery_fee', 'service_fee');
      const revenueReel = sumOrderFees(reelOrders, 'delivery_fee', 'service_fee');
      const revenueBusiness = businessOrders.reduce(
        (sum, o) =>
          sum + parseFloat(o.service_fee || '0') + parseFloat(o.transportation_fee || '0'),
        0
      );
      const revenueRestaurant = restaurantOrders.reduce(
        (sum, o) => sum + parseFloat(o.delivery_fee || '0'),
        0
      );
      const totalRevenue = revenueRegular + revenueReel + revenueBusiness + revenueRestaurant;

      const ratingsCount = ratings.length;
      const ratingsAverage =
        ratingsCount > 0
          ? ratings.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / ratingsCount
          : 0;

      const summary = {
        earnings: totalRevenue,
        available_balance: wallet ? parseFloat(wallet.available_balance || '0') : 0,
        reserved_balance: wallet ? parseFloat(wallet.reserved_balance || '0') : 0,
        pending_withdraw_amount: pendingWithdrawAmount,
        withdraw_requests_count: withdrawRequests.length,
        ratings_count: ratingsCount,
        ratings_average: Math.round(ratingsAverage * 10) / 10,
        total_revenue: totalRevenue,
        revenue_regular: revenueRegular,
        revenue_business: revenueBusiness,
        revenue_restaurant: revenueRestaurant,
        revenue_reel: revenueReel,
      };
      return NextResponse.json({
        shoppers,
        Orders: orders,
        reel_orders: reelOrders,
        businessProductOrders: businessOrders,
        restaurant_orders: restaurantOrders,
        summary,
        withdraw_requests: withdrawRequests,
        revenues,
      });
    }
    const data = await hasuraClient.request<{ shoppers: any[] }>(GET_SHOPPERS);
    return NextResponse.json({ shoppers: data.shoppers || [] });
  } catch (error) {
    console.error('Error fetching shoppers:', error);
    return NextResponse.json({ error: 'Failed to fetch shoppers' }, { status: 500 });
  }
}
