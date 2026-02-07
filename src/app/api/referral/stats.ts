import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Query to get referral code
const GET_REFERRAL_CODE = gql`
  query GetReferralCode($user_id: uuid!) {
    referral_codes(where: { user_id: { _eq: $user_id } }) {
      id
      code
    }
  }
`;

// Query to get referral statistics
const GET_REFERRAL_STATS = gql`
  query GetReferralStats($referral_code: String!) {
    referrals_aggregate(where: { referral_code: { _eq: $referral_code } }) {
      aggregate {
        count
      }
    }
    referrals(
      where: { referral_code: { _eq: $referral_code } }
      order_by: { created_at: desc }
    ) {
      id
      referred_user_id
      referral_code
      order_id
      created_at
      ReferredUser {
        id
        name
        email
        phone
      }
      Order {
        id
        OrderID
        total
        status
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user_id = session.user.id;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get user's referral code
    const referralCodeData = await hasuraClient.request<{
      referral_codes: Array<{ id: string; code: string }>;
    }>(GET_REFERRAL_CODE, { user_id });

    if (
      !referralCodeData.referral_codes ||
      referralCodeData.referral_codes.length === 0
    ) {
      return res.status(200).json({
        totalReferrals: 0,
        totalOrders: 0,
        totalEarnings: 0,
        referrals: [],
      });
    }

    const referralCode = referralCodeData.referral_codes[0].code;

    // Get referral statistics
    const statsData = await hasuraClient.request<{
      referrals_aggregate: {
        aggregate: { count: number };
      };
      referrals: Array<{
        id: string;
        referred_user_id: string;
        referral_code: string;
        order_id: string | null;
        created_at: string;
        ReferredUser: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
        } | null;
        Order: {
          id: string;
          OrderID: string;
          total: string;
          status: string;
        } | null;
      }>;
    }>(GET_REFERRAL_STATS, { referral_code: referralCode });

    const totalReferrals = statsData.referrals_aggregate.aggregate.count;
    const referrals = statsData.referrals || [];

    // Calculate total orders and earnings
    const ordersWithReferrals = referrals.filter((r) => r.order_id && r.Order);
    const totalOrders = ordersWithReferrals.length;

    // Calculate earnings (you can customize this based on your commission structure)
    // Example: 5% commission on each order
    const totalEarnings = ordersWithReferrals.reduce((sum, ref) => {
      const orderTotal = parseFloat(ref.Order?.total || "0");
      const commission = orderTotal * 0.05; // 5% commission
      return sum + commission;
    }, 0);

    return res.status(200).json({
      totalReferrals,
      totalOrders,
      totalEarnings: totalEarnings.toFixed(2),
      referrals: referrals.map((ref) => ({
        id: ref.id,
        referredUser: ref.ReferredUser
          ? {
              id: ref.ReferredUser.id,
              name: ref.ReferredUser.name,
              email: ref.ReferredUser.email,
              phone: ref.ReferredUser.phone,
            }
          : null,
        order: ref.Order
          ? {
              id: ref.Order.id,
              orderID: ref.Order.OrderID,
              total: ref.Order.total,
              status: ref.Order.status,
            }
          : null,
        createdAt: ref.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch referral statistics",
    });
  }
}
