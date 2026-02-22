import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

const GET_PLASMARKET_BUSINESSES = gql`
  query GetPlasMarketBusinesses {
    business_accounts(
      order_by: { created_at: desc }
    ) {
      account_type
      business_email
      business_location
      business_name
      business_phone
      created_at
      face_image
      id
      id_image
      rdb_certificate
      status
      updated_at
      user_id
      Users {
        created_at
        email
        gender
        name
        phone
        profile_picture
        id
        is_active
        is_guest
      }
      business_stores {
        address
        business_id
        image
        id
        description
        created_at
        category_id
        is_active
        latitude
        longitude
        name
        operating_hours
        PlasBusinessProductsOrSerives {
          Description
          Image
          Plasbusiness_id
          category
          created_at
          delveryArea
          enabled
          id
          maxOrders
          minimumOrders
          name
          otherDetails
          price
          store_id
          status
          speciality
          query_id
          unit
          updated_on
          user_id
        }
        businessProductOrders {
          OrderID
          allProducts
          delivered_time
          created_at
          comment
          combined_order_id
          delivery_proof
          deliveryAddress
          longitude
          latitude
          id
          ordered_by
          pin
          service_fee
          shopper {
            shopper {
              Employment_id
              Police_Clearance_Cert
              active
              address
              background_check_completed
              collection_comment
              created_at
              drivingLicense_Image
              full_name
              guarantorPhone
              guarantorRelationship
              latitude
              longitude
              mutual_status
              phone
              onboarding_step
              proofOfResidency
              phone_number
              profile_photo
              updated_at
              transport_mode
              status
            }
            updated_at
          }
          business_store {
            id
            description
            image
            is_active
            latitude
            longitude
            name
            operating_hours
            business_id
            category_id
            created_at
          }
          orderedBy {
            email
            gender
            created_at
            id
            is_active
            is_guest
            name
            phone
          }
          store_id
          timeRange
          total
          units
          transportation_fee
          status
        }
        Category {
          description
          created_at
          id
          image
          is_active
          name
        }
      }
      BusinessQoutes {
        DeliveryTerms
        PaymentTerms
        attachement
        attachment_1
        attachment_2
        businessRfq_id
        cancellatioinTerms
        created_at
        currency
        delivery_time
        id
        message
        qouteAmount
        quote_validity
        respond_business_id
        status
        updated_at
        warrantly
      }
      business_wallets {
        amount
        business_id
        created_at
        id
        query_id
        updated_at
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
      }
      bussines_RFQs {
        attachment
        business_id
        cancellation_terms
        category
        contact_name
        created_at
        delivery_terms
        description
        email
        estimated_quantity
        expected_delivery_date
        id
        location
        max_budget
        min_budget
        notes
        open
        payment_terms
        phone
        requirements
        response_date
        title
        updated_at
        urgency_level
        user_id
        warranty_information
        Users {
          gender
          email
          name
          password_hash
          phone
          id
        }
        BusinessQoutes {
          DeliveryTerms
          PaymentTerms
          attachement
          attachment_1
          attachment_2
          businessRfq_id
          cancellatioinTerms
          created_at
          currency
          delivery_time
          id
          message
          qouteAmount
          quote_validity
          respond_business_id
          status
          updated_at
          warrantly
          business_account {
            account_type
            business_email
            business_location
            business_name
            business_phone
            face_image
            created_at
            id_image
            rdb_certificate
            status
            updated_at
            user_id
          }
        }
        BusinessContract {
          bussinessProfile_id
          clientPhoto
          clientSignature
          contract_Value
          done_at
          dueDate
          duration
          endDate
          id
          paymentSchedule
          paymentTerms
          projecDeliverables
          proofAggred
          rfq_response_id
          specialConditions
          startDate
          status
          supplierPhoto
          supplierSignature
          terminationTerms
          type
          update_on
          value
        }
      }
    }
  }
`;

export async function GET(req: Request) {
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

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const result = await hasuraClient.request<any>(GET_PLASMARKET_BUSINESSES);

    const formattedBusinesses = (result.business_accounts || []).map((biz: any) => {
      // Aggregate properties
      const stores = biz.business_stores || [];
      const rfqs = biz.bussines_RFQs || [];
      const wallets = biz.business_wallets || [];
      const quotes = biz.BusinessQoutes || [];

      // Calculate orders across stores
      let totalOrders = 0;
      stores.forEach((store: any) => {
        totalOrders += (store.businessProductOrders?.length || 0);
      });

      // Calculate accepted contracts across RFQs
      let totalContracts = 0;
      rfqs.forEach((rfq: any) => {
        totalContracts += (rfq.BusinessContract?.length || 0);
      });

      return {
        id: biz.id,
        business_name: biz.business_name || 'Unnamed Business',
        business_email: biz.business_email,
        business_phone: biz.business_phone,
        business_location: biz.business_location,
        status: biz.status || 'in_review',
        created_at: biz.created_at,

        // Counts
        stores_count: stores.length,
        rfqs_count: rfqs.length,
        contracts_count: totalContracts,
        orders_count: totalOrders,
        wallet_count: wallets.length,
        quotes_count: quotes.length,

        // Owner Profile
        owner: biz.Users ? {
          id: biz.Users.id,
          name: biz.Users.name || 'Unknown',
          email: biz.Users.email,
          phone: biz.Users.phone,
          profile_picture: biz.Users.profile_picture,
          is_active: biz.Users.is_active,
        } : null,

        // Raw Deep Nested Relationships
        // These will be used in the detailed business profile view
        raw_data: {
          stores,
          rfqs,
          wallets,
          quotes,
          account_type: biz.account_type,
          face_image: biz.face_image,
          id_image: biz.id_image,
          rdb_certificate: biz.rdb_certificate,
        }
      };
    });

    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
    });

  } catch (error: any) {
    console.error('Error fetching PlasMarket businesses:', error);
    return NextResponse.json({
      error: 'Failed to fetch PlasMarket businesses',
      message: error.message,
    }, { status: 500 });
  }
}
