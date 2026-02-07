import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const UPDATE_SHOPPER_TELEGRAM_ID = gql`
  mutation UpdateShopperTelegramId($shopper_id: uuid!, $telegram_id: String!) {
    update_shoppers_by_pk(
      pk_columns: { id: $shopper_id }
      _set: { telegram_id: $telegram_id }
    ) {
      id
      telegram_id
      full_name
      status
      active
    }
  }
`;

const UPDATE_SHOPPER_STATUS = gql`
  mutation UpdateShopperStatus($shopper_id: uuid!, $status: String!) {
    update_shoppers_by_pk(
      pk_columns: { id: $shopper_id }
      _set: { status: $status }
    ) {
      id
      status
      full_name
      telegram_id
    }
  }
`;

const GET_SHOPPER_BY_TELEGRAM_ID = gql`
  query GetShopperByTelegramId($telegram_id: String!) {
    shoppers(where: { telegram_id: { _eq: $telegram_id } }) {
      id
      full_name
      status
      active
      telegram_id
      user_id
      phone_number
      address
      transport_mode
      created_at
      updated_at
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as {
      user?: { id?: string };
    } | null;

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { action, shopperId, telegramId, status } = req.body;

    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    switch (action) {
      case "update_telegram_id":
        if (!shopperId || !telegramId) {
          return res.status(400).json({
            error: "Missing required fields: shopperId and telegramId",
          });
        }

        // Verify the authenticated user matches the shopper
        const shopperData = await hasuraClient.request<{
          shoppers: Array<{ id: string }>;
        }>(
          gql`
            query GetShopperByUserId($user_id: uuid!) {
              shoppers(where: { user_id: { _eq: $user_id } }) {
                id
              }
            }
          `,
          { user_id: session.user.id }
        );

        if (
          !shopperData.shoppers.length ||
          shopperData.shoppers[0].id !== shopperId
        ) {
          return res.status(403).json({
            error: "Not authorized to update this shopper",
          });
        }

        // Update Telegram ID
        const updateResult = await hasuraClient.request<{
          update_shoppers_by_pk: {
            id: string;
            telegram_id: string;
            full_name: string;
            status: string;
            active: boolean;
          };
        }>(UPDATE_SHOPPER_TELEGRAM_ID, {
          shopper_id: shopperId,
          telegram_id: telegramId,
        });

        console.log(
          `✅ Telegram ID updated for shopper ${shopperId}: ${telegramId}`
        );

        return res.status(200).json({
          success: true,
          shopper: updateResult.update_shoppers_by_pk,
        });

      case "update_status":
        if (!shopperId || !status) {
          return res.status(400).json({
            error: "Missing required fields: shopperId and status",
          });
        }

        // Update status
        const statusResult = await hasuraClient.request<{
          update_shoppers_by_pk: {
            id: string;
            status: string;
            full_name: string;
            telegram_id: string;
          };
        }>(UPDATE_SHOPPER_STATUS, { shopper_id: shopperId, status });

        console.log(`✅ Status updated for shopper ${shopperId}: ${status}`);

        return res.status(200).json({
          success: true,
          shopper: statusResult.update_shoppers_by_pk,
        });

      case "get_by_telegram_id":
        if (!telegramId) {
          return res.status(400).json({
            error: "Missing required field: telegramId",
          });
        }

        // Get shopper by Telegram ID
        const shopperResult = await hasuraClient.request<{
          shoppers: Array<{
            id: string;
            full_name: string;
            status: string;
            active: boolean;
            telegram_id: string;
            user_id: string;
            phone_number: string;
            address: string;
            transport_mode: string;
            created_at: string;
            updated_at: string;
          }>;
        }>(GET_SHOPPER_BY_TELEGRAM_ID, { telegram_id: telegramId });

        return res.status(200).json({
          success: true,
          shopper: shopperResult.shoppers[0] || null,
        });

      default:
        return res.status(400).json({
          error:
            "Invalid action. Use: update_telegram_id, update_status, or get_by_telegram_id",
        });
    }
  } catch (error) {
    console.error("Error updating shopper:", error);
    return res.status(500).json({
      error: "Failed to update shopper",
    });
  }
}
