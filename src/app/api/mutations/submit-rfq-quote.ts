import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const SUBMIT_RFQ_QUOTE = gql`
  mutation SubmitRFQQuote(
    $businessRfq_id: uuid!
    $respond_business_id: uuid = ""
    $qouteAmount: String = ""
    $delivery_time: String = ""
    $quote_validity: String = ""
    $message: String = ""
    $PaymentTerms: String = ""
    $DeliveryTerms: String = ""
    $warrantly: String = ""
    $cancellatioinTerms: String = ""
    $attachement: String = ""
    $attachment_1: String = ""
    $attachment_2: String = ""
    $status: String = ""
    $currency: String = ""
  ) {
    insert_BusinessQoute(
      objects: {
        businessRfq_id: $businessRfq_id
        respond_business_id: $respond_business_id
        qouteAmount: $qouteAmount
        delivery_time: $delivery_time
        quote_validity: $quote_validity
        message: $message
        PaymentTerms: $PaymentTerms
        DeliveryTerms: $DeliveryTerms
        warrantly: $warrantly
        cancellatioinTerms: $cancellatioinTerms
        attachement: $attachement
        attachment_1: $attachment_1
        attachment_2: $attachment_2
        status: $status
        currency: $currency
      }
    ) {
      affected_rows
    }
  }
`;

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get default currency from system configuration
    let defaultCurrency = "RWF"; // Fallback default (matches formatCurrency.ts)
    try {
      const GET_SYSTEM_CONFIG = gql`
        query GetSystemConfiguration {
          System_configuratioins(limit: 1) {
            currency
          }
        }
      `;
      const configResult = await hasuraClient.request<{
        System_configuratioins: Array<{ currency: string }>;
      }>(GET_SYSTEM_CONFIG);
      if (
        configResult.System_configuratioins &&
        configResult.System_configuratioins.length > 0
      ) {
        defaultCurrency =
          configResult.System_configuratioins[0].currency || "RWF";
      }
    } catch (error) {
      // Use fallback default if config fetch fails (matches formatCurrency.ts behavior)
      console.warn(
        "Failed to fetch system configuration, using default currency:",
        error
      );
    }

    const user_id = session.user.id;
    const {
      businessRfq_id,
      qouteAmount,
      delivery_time,
      quote_validity,
      message,
      PaymentTerms,
      DeliveryTerms,
      warrantly,
      cancellatioinTerms,
      attachement,
      attachment_1,
      attachment_2,
      currency,
      status = "pending",
    } = req.body;

    if (!businessRfq_id) {
      return res.status(400).json({ error: "RFQ ID is required" });
    }

    if (!qouteAmount) {
      return res.status(400).json({ error: "Quote amount is required" });
    }

    // Get business_id from business account
    let business_id: string | null = null;
    try {
      const CHECK_BUSINESS_ACCOUNT = gql`
        query CheckBusinessAccount($user_id: uuid!) {
          business_accounts(where: { user_id: { _eq: $user_id } }, limit: 1) {
            id
          }
        }
      `;
      const accountResult = await hasuraClient.request<{
        business_accounts: Array<{ id: string }>;
      }>(CHECK_BUSINESS_ACCOUNT, {
        user_id: user_id,
      });
      if (
        accountResult.business_accounts &&
        accountResult.business_accounts.length > 0
      ) {
        business_id = accountResult.business_accounts[0].id;
      }
    } catch (error) {
      // If no business account, continue without business_id
    }

    // Validate attachment sizes before sending to GraphQL
    // GraphQL and database may have limits on string field sizes
    const maxAttachmentSize = 3 * 1024 * 1024; // 3MB base64 string limit

    const validateAttachment = (
      attachment: string | undefined,
      fieldName: string
    ) => {
      if (!attachment) return "";
      if (attachment.length > maxAttachmentSize) {
        throw new Error(`${fieldName} is too large. Maximum size is 3MB.`);
      }
      return attachment;
    };

    const validatedAttachement = validateAttachment(attachement, "Attachment");
    const validatedAttachment1 = validateAttachment(
      attachment_1,
      "Attachment 1"
    );
    const validatedAttachment2 = validateAttachment(
      attachment_2,
      "Attachment 2"
    );

    const result = await hasuraClient.request<{
      insert_BusinessQoute: {
        affected_rows: number;
      };
    }>(SUBMIT_RFQ_QUOTE, {
      businessRfq_id: businessRfq_id,
      respond_business_id: business_id || "",
      qouteAmount: qouteAmount.toString(),
      delivery_time: delivery_time || "",
      quote_validity: quote_validity || "",
      message: message || "",
      PaymentTerms: PaymentTerms || "",
      DeliveryTerms: DeliveryTerms || "",
      warrantly: warrantly || "",
      cancellatioinTerms: cancellatioinTerms || "",
      attachement: validatedAttachement,
      attachment_1: validatedAttachment1,
      attachment_2: validatedAttachment2,
      currency: currency || defaultCurrency,
      status: status || "pending",
    });

    return res.status(200).json({
      success: true,
      affected_rows: result.insert_BusinessQoute.affected_rows,
    });
  } catch (error: any) {
    console.error("Error submitting RFQ quote:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response,
      request: error.request,
    });

    // Extract GraphQL errors if present
    const graphqlErrors = error.response?.errors || [];
    const errorMessages = graphqlErrors
      .map((err: any) => err.message)
      .join(", ");

    return res.status(500).json({
      error: "Failed to submit quote",
      message: error.message || "Unknown error",
      graphqlErrors: errorMessages || undefined,
      details: error.response?.errors || undefined,
    });
  }
}
