import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logger } from "../../../src/utils/logger";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// GraphQL query to fetch shopper invoices
const GET_SHOPPER_INVOICES = gql`
  query getInvoiceDetials($shopper_id: uuid!, $limit: Int!, $offset: Int) {
    Invoices(
      where: { Order: { shopper_id: { _eq: $shopper_id } } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      created_at
      Proof
      customer_id
      delivery_fee
      discount
      id
      status
      service_fee
      restarurant_order_id
      reel_order_id
      order_id
      invoice_number
      invoice_items
      subtotal
      tax
      total_amount
      User {
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
        role
        updated_at
        shopper {
          Employment_id
          Police_Clearance_Cert
          active
          address
          background_check_completed
          collection_comment
          created_at
          drivingLicense_Image
          driving_license
          full_name
          guarantor
          national_id
          longitude
          latitude
          id
          guarantorRelationship
          guarantorPhone
          mutual_StatusCertificate
          mutual_status
          phone
          phone_number
          profile_photo
          proofOfResidency
          updated_at
          transport_mode
          telegram_id
          status
          signature
        }
      }
      Order {
        OrderID
        assigned_at
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
        Shop {
          id
          name
          address
        }
        Address {
          street
          city
          postal_code
        }
        Order_Items {
          id
          price
          product_id
          quantity
          Product {
            id
            final_price
            image
            ProductName {
              name
            }
          }
        }
      }
    }
    Invoices_aggregate(where: { User: { id: { _eq: $shopper_id } } }) {
      aggregate {
        count
      }
    }
  }
`;

interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string;
  reel_order_id?: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  tax: number;
  discount?: number;
  status: string;
  created_at: string;
  invoice_items: any;
  customer_id: string;
  Proof?: string;
  User: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  Order?: {
    id: string;
    OrderID: string;
    total: string;
    service_fee: string;
    delivery_fee: string;
    created_at: string;
    status: string;
    delivery_time: string;
    delivery_notes?: string;
    Shop: {
      id: string;
      name: string;
      address: string;
    };
    userByUserId: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    Address: {
      street: string;
      city: string;
      postal_code: string;
    };
    Order_Items_aggregate: {
      aggregate: {
        count: number;
      };
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let shopperId: string | null = null;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log({
      method: req.method,
      query: req.query,
    });

    // Authenticate user
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as any;

    console.log({
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!session?.user?.id) {
      console.error("Invoices API: Unauthorized - No session user ID");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const shopperIdLocal = session.user.id;
    shopperId = shopperIdLocal;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10; // Items per page
    const offset = (page - 1) * limit;

    console.log({
      shopperId,
      page,
      limit,
      offset,
    });

    if (!hasuraClient) {
      console.error("Invoices API: Hasura client not initialized");
      throw new Error("Hasura client is not initialized");
    }

    // Fetch invoices from database
    const data = await hasuraClient.request<{
      Invoices: Array<{
        id: string;
        invoice_number: string;
        order_id?: string;
        reel_order_id?: string;
        restarurant_order_id?: string;
        total_amount: string;
        subtotal: string;
        delivery_fee: string;
        service_fee: string;
        tax: string;
        discount: string;
        status: string;
        created_at: string;
        invoice_items: any;
        customer_id: string;
        Proof?: string;
        Order?: {
          id: string;
          OrderID: string;
          total: string;
          service_fee: string;
          delivery_fee: string;
          created_at: string;
          status: string;
          delivery_time: string;
          delivery_notes?: string;
          delivery_photo_url?: string;
          shopper_id: string;
          Shop?: {
            id: string;
            name: string;
            address: string;
          };
          userByUserId?: {
            id: string;
            name: string;
            email: string;
            phone: string;
          };
          Address?: {
            street: string;
            city: string;
            postal_code: string;
          };
          Order_Items?: Array<{
            id: string;
            quantity: number;
            price: string;
            Product?: {
              id: string;
              name?: string;
              final_price: string;
              image?: string;
              category?: string;
              ProductName?: {
                name: string;
                description?: string;
              };
            };
          }>;
        };
        User: {
          id: string;
          name: string;
          email: string;
          phone: string;
          shopper?: {
            id: string;
            phone: string;
            status: string;
            [key: string]: any;
          };
        };
      }>;
      Invoices_aggregate: {
        aggregate: {
          count: number;
        };
      };
    }>(GET_SHOPPER_INVOICES, {
      shopper_id: shopperIdLocal,
      limit,
      offset,
    });

    console.log({
      invoiceCount: data.Invoices?.length,
      totalCount: data.Invoices_aggregate?.aggregate?.count,
    });

    // Transform all invoices (both regular and reel orders)

    const transformedInvoices = data.Invoices.map((invoice, index) => {
      const isReelOrder = !!invoice.reel_order_id;
      const isRestaurantOrder = !!invoice.restarurant_order_id;

      if (isReelOrder || isRestaurantOrder) {
        // Handle reel or restaurant order invoice
        const orderType = isReelOrder
          ? ("reel" as const)
          : ("restaurant" as const);
        const orderId = isReelOrder
          ? invoice.reel_order_id
          : invoice.restarurant_order_id;

        return {
          id: invoice.id, // Use the actual invoice ID
          invoice_number: invoice.invoice_number,
          order_id: orderId,
          order_type: orderType,
          total_amount: parseFloat(invoice.total_amount),
          subtotal: parseFloat(invoice.subtotal),
          delivery_fee: parseFloat(invoice.delivery_fee),
          service_fee: parseFloat(invoice.service_fee),
          tax: parseFloat(invoice.tax),
          discount: parseFloat(invoice.discount),
          created_at: invoice.created_at,
          status: invoice.status as "paid" | "pending" | "overdue",
          customer_name: invoice.User.name,
          customer_email: invoice.User.email,
          customer_phone: invoice.User.phone,
          customer_address: "Address not available",
          items_count: invoice.invoice_items?.length || 1,
          shop_name: isReelOrder ? "Reel Order" : "Restaurant Order",
          shop_address: "N/A",
          delivery_time: null,
          delivery_notes: null,
          order_status: "completed",
          Proof: invoice.Proof,
          delivery_photo_url: invoice.Order?.delivery_photo_url,
          reel_title:
            invoice.invoice_items?.[0]?.description ||
            (isReelOrder ? "Reel Order" : "Restaurant Order"),
          reel_details: {
            title:
              invoice.invoice_items?.[0]?.description ||
              (isReelOrder ? "Reel Order" : "Restaurant Order"),
            description: invoice.invoice_items?.[0]?.description || "",
            product:
              invoice.invoice_items?.[0]?.name ||
              (isReelOrder ? "Reel" : "Restaurant"),
            quantity: invoice.invoice_items?.[0]?.quantity || 1,
          },
        };
      } else {
        // Handle regular order invoice
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          order_id: invoice.order_id,
          order_type: "regular" as const,
          total_amount: parseFloat(invoice.total_amount),
          subtotal: parseFloat(invoice.subtotal),
          delivery_fee: parseFloat(invoice.delivery_fee),
          service_fee: parseFloat(invoice.service_fee),
          tax: parseFloat(invoice.tax),
          discount: parseFloat(invoice.discount),
          created_at: invoice.created_at,
          status: invoice.status as "paid" | "pending" | "overdue",
          customer_name: invoice.User.name,
          customer_email: invoice.User.email,
          customer_phone: invoice.User.phone,
          customer_address: invoice.Order?.Address
            ? `${invoice.Order.Address.street}, ${invoice.Order.Address.city}`
            : "Address not available",
          items_count: invoice.Order?.Order_Items?.length || 0,
          shop_name: invoice.Order?.Shop?.name || "Shop",
          shop_address: invoice.Order?.Shop?.address || "Address not available",
          delivery_time: invoice.Order?.delivery_time,
          delivery_notes: invoice.Order?.delivery_notes,
          order_status: invoice.Order?.status || "unknown",
          Proof: invoice.Proof,
          delivery_photo_url: invoice.Order?.delivery_photo_url,
        };
      }
    });

    console.log({
      transformedCount: transformedInvoices.length,
    });

    // Sort by creation date
    const sortedInvoices = transformedInvoices.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const totalCount = data.Invoices_aggregate.aggregate.count;
    const totalPages = Math.ceil(totalCount / limit);

    logger.info("Invoices fetched successfully", "ShopperInvoicesAPI", {
      shopperId,
      count: sortedInvoices.length,
      totalCount,
      page,
      totalPages,
    });

    return res.status(200).json({
      success: true,
      invoices: sortedInvoices,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error("Invoices API: Error caught", error);
    if (error && typeof error === "object" && "response" in error) {
      console.error(
        "Invoices API: Hasura Error Response",
        JSON.stringify((error as any).response, null, 2)
      );
    }

    logger.error(
      "Error fetching shopper invoices",
      "ShopperInvoicesAPI",
      error
    );

    await logErrorToSlack("ShopperInvoicesAPI", error, {
      shopperId,
      method: req.method,
    });
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch invoices",
    });
  }
}
