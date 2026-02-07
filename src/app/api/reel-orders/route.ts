import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";
import { notifyNewOrderToSlack } from "@/lib/slackOrderNotifier";

const GET_ADDRESS_AND_USER = gql`
  query GetAddressAndUser($address_id: uuid!) {
    Addresses_by_pk(id: $address_id) {
      street
      city
      postal_code
      User {
        name
        email
        phone
      }
      is_default
      placeDetails
    }
  }
`;

function generateOrderPin(): string {
  return Math.floor(Math.random() * 100).toString().padStart(2, "0");
}

const CREATE_REEL_ORDER = gql`
  mutation CreateReelOrder(
    $user_id: uuid!
    $reel_id: uuid!
    $quantity: String!
    $total: String!
    $service_fee: String!
    $delivery_fee: String!
    $discount: String
    $voucher_code: String
    $delivery_time: String!
    $delivery_note: String
    $delivery_address_id: uuid!
    $pin: String!
  ) {
    insert_reel_orders_one(
      object: {
        user_id: $user_id
        reel_id: $reel_id
        quantity: $quantity
        total: $total
        service_fee: $service_fee
        delivery_fee: $delivery_fee
        discount: $discount
        voucher_code: $voucher_code
        delivery_time: $delivery_time
        delivery_note: $delivery_note
        delivery_address_id: $delivery_address_id
        shopper_id: null
        status: "PENDING"
        found: false
        pin: $pin
      }
    ) {
      id
      OrderID
      pin
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = session.user.id;
  const body = await request.json();
  const {
    reel_id,
    quantity,
    total,
    service_fee,
    delivery_fee,
    discount,
    voucher_code,
    delivery_time,
    delivery_note,
    delivery_address_id,
  } = body;
  if (
    !reel_id ||
    !quantity ||
    !total ||
    !service_fee ||
    !delivery_fee ||
    !delivery_time ||
    !delivery_address_id
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: reel_id, quantity, total, service_fee, delivery_fee, delivery_time, delivery_address_id",
      },
      { status: 400 }
    );
  }
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const orderPin = generateOrderPin();
    const orderRes = await hasuraClient.request<{
      insert_reel_orders_one: { id: string; OrderID: string; pin: string };
    }>(CREATE_REEL_ORDER, {
      user_id,
      reel_id,
      quantity: quantity.toString(),
      total,
      service_fee,
      delivery_fee,
      discount: discount || null,
      voucher_code: voucher_code || null,
      delivery_time,
      delivery_note: delivery_note || "",
      delivery_address_id,
      pin: orderPin,
    });
    const orderId = orderRes.insert_reel_orders_one.id;
    const orderNumber = orderRes.insert_reel_orders_one.OrderID;
    let customerAddress: string | undefined;
    let customerPhone: string | undefined;
    let customerName: string | undefined;
    try {
      const addrRes = await hasuraClient.request<{
        Addresses_by_pk: {
          street: string;
          city: string;
          postal_code: string;
          User: {
            name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
        } | null;
      }>(GET_ADDRESS_AND_USER, { address_id: delivery_address_id });
      if (addrRes.Addresses_by_pk) {
        const a = addrRes.Addresses_by_pk;
        customerAddress = [a.street, a.city, a.postal_code]
          .filter(Boolean)
          .join(", ");
        customerName = a.User?.name ?? undefined;
        customerPhone = a.User?.phone ?? undefined;
      }
    } catch {
      // non-blocking
    }
    void notifyNewOrderToSlack({
      id: orderId,
      orderID: orderNumber,
      total,
      orderType: "reel",
      storeName: "Reel order",
      units: quantity,
      customerName,
      customerPhone,
      customerAddress,
      deliveryTime: delivery_time,
    });
    return NextResponse.json({
      success: true,
      order_id: orderId,
      order_number: orderNumber,
      pin: orderPin,
      message: "Reel order placed successfully",
    });
  } catch (error: any) {
    console.error("Reel order creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to place reel order" },
      { status: 500 }
    );
  }
}
