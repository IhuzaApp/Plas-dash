import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_PACKAGE_DELIVERIES = gql`
  query GetPackageDeliveries($where: package_delivery_bool_exp = {}) {
    package_delivery(where: $where, order_by: { created_at: desc }) {
      comment
      created_at
      DeliveryCode
      deliveryMethod
      delivery_fee
      distance
      dropoffDetails
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
      receiverPhone
      scheduled
      shopper_id
      status
      timeAndDate
      updated_at
      user_id
      order_transactions {
        amount
        business_order_id
        created_at
        currency
        id
        order_id
        mtn_response
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
        User {
          email
          gender
          id
          is_active
          is_guest
          name
          password_hash
          phone
          profile_picture
          role
          updated_at
        }
      }
      shopper {
        Employment_id
        active
        address
        collection_comment
        courier
        dob
        email
        full_name
        face_verified
        guarantor
        mutual_StatusCertificate
        mutual_status
        national_id
        national_id_photo_front
        needCollection
        onboarding_step
        national_id_photo_back
        phone_number
        phone
        plate_number
        profile_photo
        proofOfResidency
        signature
        status
        transport_mode
        updated_at
        user_id
        verification_metadata
      }
    }
  }
`;

export async function GET(req: Request) {
  try {
    const userContext = await getUserContext(req);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let where: any = {};

    if (status && status !== 'all') {
      where.status = { _eq: status };
    }

    // If not a project user (admin), filter by user_id
    if (!userContext.isProjectUser) {
      where.user_id = { _eq: userContext.userId };
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request<{ package_delivery: any[] }>(GET_PACKAGE_DELIVERIES, {
      where,
    });

    return NextResponse.json({ packages: data.package_delivery });
  } catch (error) {
    console.error('Error fetching package deliveries', error);
    return NextResponse.json({ error: 'Failed to fetch package deliveries' }, { status: 500 });
  }
}
