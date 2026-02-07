import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { sendRejectedAccountSupportRequestToSlack } from "../../../src/lib/slackSupportNotifier";

type Body = {
  message: string;
  priority: "low" | "medium" | "high";
  businessAccountId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = (await getServerSession(req, res, authOptions as any)) as {
    user: { id?: string; name?: string | null; email?: string | null };
  } | null;

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const body = req.body as Body;
    const { message, priority, businessAccountId } = body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const validPriorities = ["low", "medium", "high"] as const;
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: "Priority must be low, medium, or high",
      });
    }

    await sendRejectedAccountSupportRequestToSlack({
      message: message.trim(),
      priority,
      userEmail: session.user.email ?? undefined,
      userName: session.user.name ?? undefined,
      userId: session.user.id,
      businessAccountId: businessAccountId || undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Your request has been sent to support.",
    });
  } catch (error: any) {
    console.error("Rejected account support request failed:", error);
    return res.status(500).json({
      error: "Failed to send request to support",
      message: error?.message,
    });
  }
}
