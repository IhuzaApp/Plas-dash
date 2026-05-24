import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Admin dashboard: full shopper list from getShopperInformation.graphql
const GET_SHOPPERS = gql`
  query getShopperInformation {
    shoppers(order_by: { created_at: desc }) {
      Employment_id
      Police_Clearance_Cert
      SignaturePad
      active
      address
      background_check_completed
      collection_comment
      courier
      created_at
      dob
      drivingLicense_Image
      verification_metadata
      user_id
      updated_at
      transport_mode
      status
      signature
      proofOfResidency
      profile_photo
      plate_number
      phone_number
      phone
      onboarding_step
      needCollection
      national_id_photo_front
      national_id_photo_back
      national_id
      mutual_status
      id
      guarantorRelationship
      latitude
      longitude
      mutual_StatusCertificate
      guarantorPhone
      guarantor
      full_name
      driving_license
      driving_license_back
      driving_license_front
      email
      face_liveness_images
      face_verified
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
      Police_Clearance_Cert
      SignaturePad
      active
      address
      background_check_completed
      collection_comment
      courier
      created_at
      dob
      drivingLicense_Image
      verification_metadata
      user_id
      updated_at
      transport_mode
      status
      signature
      proofOfResidency
      profile_photo
      plate_number
      phone_number
      phone
      onboarding_step
      needCollection
      national_id_photo_front
      national_id_photo_back
      national_id
      mutual_status
      id
      guarantorRelationship
      latitude
      longitude
      mutual_StatusCertificate
      guarantorPhone
      guarantor
      full_name
      driving_license
      driving_license_back
      driving_license_front
      email
      face_liveness_images
      face_verified
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
          vehicleBookingsId
          package_id
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
          projectUser_id
          employee_id
          description
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
          restarurant_order_id
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
          reel_order_id
          package_id
          package_delivery {
            DeliveryCode
            comment
            deliveryMethod
            delivery_fee
            dropoffDetails
            distance
            dropoffLocation
            dropoff_latitude
            dropoff_longitude
            id
            package_image
            package_pickup_image
            payment_method
            pickupDetials
            pickupLocation
            pickup_latitude
            pickup_longitude
            receiverName
            scheduled
            receiverPhone
            shopper_id
            status
            timeAndDate
            updated_at
            user_id
          }
          code
          business_order_id
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
        is_guest
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
      order_offers {
        business_order_id
        done_on
        expires_at
        id
        offered_at
        order_id
        order_type
        package_order_id
        reel_order_id
        restaurant_order_id
        round_number
        shopper_id
        status
        updated_at
        reelOrders {
          OrderID
          id
          delivery_time
          discount
          discount_breakdown
          found
          payment_method
          pin
          quantity
          reel_id
          service_fee
          shopper_id
          status
          total
          updated_at
          user_id
          voucher_code
          created_at
          delivery_address_id
          delivery_fee
          delivery_note
          delivery_photo_url
          applied_promotions
          assigned_at
          combined_order_id
          User {
            email
            gender
            phone
          }
        }
      }
      businessProductOrders {
        OrderID
        id
        allProducts
        combined_order_id
        comment
        created_at
        delivered_time
        deliveryAddress
        delivery_proof
        latitude
        longitude
        pin
        ordered_by
        orderedBy {
          gender
          email
          id
          is_active
          is_guest
          created_at
          name
          phone
          profile_picture
        }
        status
        store_id
        timeRange
        total
        transportation_fee
        units
        service_fee
        shopper_id
      }
      Orders {
        OrderID
        id
        pin
        service_fee
        shop_id
        shopper_id
        status
        updated_at
        total
        user_id
        voucher_code
        delivery_photo_url
        delivery_time
        discount
        discount_breakdown
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        assigned_at
        applied_promotions
      }
      package_deliveries {
        DeliveryCode
        comment
        distance
        id
        user_id
        updated_at
        package_image
        package_pickup_image
        payment_method
        pickupDetials
        pickupLocation
        pickup_latitude
        pickup_longitude
        receiverName
        receiverPhone
        scheduled
        shopper_id
        status
        timeAndDate
        dropoffDetails
        dropoffLocation
        dropoff_latitude
        dropoff_longitude
        deliveryMethod
        delivery_fee
        created_at
      }
      payment_requests {
        id
        order_id
        amount
        agent_approved_id
        created_at
        shop_id
        shopper_id
        status
        transactionCode
        updated_on
      }
      reel_orders {
        OrderID
        id
        pin
        payment_method
        quantity
        reel_id
        service_fee
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
        found
        discount_breakdown
        discount
        applied_promotions
        assigned_at
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_note
        delivery_photo_url
        delivery_time
      }
      restaurant_orders {
        OrderID
        id
        assigned_at
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        delivery_photo_url
        delivery_time
        discount
        found
        pin
        restaurant_id
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
      }
      withDraweRequests {
        businessWallet_id
        amount
        business_id
        created_at
        id
        phoneNumber
        shopperWallet_id
        shopper_id
        status
        update_at
        verification_image
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
      const wallet = shopper.Wallets?.[0];
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
