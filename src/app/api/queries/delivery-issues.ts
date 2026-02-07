import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_DELIVERY_ISSUES = gql`
  query GetDeliveryIssues {
    Delivery_Issues {
      id
      order_id
      issue_type
      description
      created_at
      shopper_id
      status
      updated_at
    }
  }
`;

interface DeliveryIssuesResponse {
  Delivery_Issues: Array<{
    id: string;
    order_id: string;
    issue_type: string;
    description: string;
    created_at: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<DeliveryIssuesResponse>(
      GET_DELIVERY_ISSUES
    );
    res.status(200).json({ delivery_issues: data.Delivery_Issues });
  } catch (error) {
    console.error("Error fetching delivery issues:", error);
    res.status(500).json({ error: "Failed to fetch delivery issues" });
  }
}
