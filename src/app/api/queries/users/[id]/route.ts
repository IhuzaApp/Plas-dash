import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_USER_BY_ID = gql`
  query GetUserById($id: uuid!) {
    Users_by_pk(id: $id) {
      id
      email
      created_at
      gender
      is_active
      name
      phone
      profile_picture
      role
      updated_at
      Addresses {
        city
        created_at
        id
        latitude
        is_default
        longitude
        postal_code
        street
        updated_at
        user_id
      }
      Invoices {
        created_at
        customer_id
        delivery_fee
        discount
        id
        invoice_items
        invoice_number
        order_id
        service_fee
        status
        subtotal
        tax
        total_amount
      }
      Wallets {
        available_balance
        id
        last_updated
        reserved_balance
        shopper_id
      }
      shopper {
        Employment_id
        active
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
      }
      Orders {
        OrderID
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        delivery_photo_url
        delivery_time
        discount
        id
        service_fee
        shop_id
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
      }
      Shopper_Availabilities {
        created_at
        day_of_week
        end_time
        id
        is_available
        start_time
        updated_at
        user_id
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
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const data = await hasuraClient.request<{ Users_by_pk: any }>(GET_USER_BY_ID, {
      id,
    });
    return NextResponse.json({ user: data.Users_by_pk ?? null });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
