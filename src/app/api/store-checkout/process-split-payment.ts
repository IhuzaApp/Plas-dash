import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

/**
 * Processes split payment: wallet + MoMo remainder.
 * 1. Deducts from personal wallet
 * 2. Requests remainder via MoMo RequestToPay
 * If wallet deduct fails: returns error.
 * If MoMo fails: refunds wallet and returns error.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { walletAmount = 0, momoAmount = 0, momoPhone, orderId } = req.body;

    const walletAmt = Math.round(parseFloat(walletAmount) * 100) / 100;
    const momoAmt = Math.round(parseFloat(momoAmount) * 100) / 100;

    if (walletAmt < 0 || momoAmt < 0) {
      return res.status(400).json({ error: "Amounts must be non-negative" });
    }

    if (walletAmt === 0 && momoAmt === 0) {
      return res
        .status(400)
        .json({ error: "At least one payment amount required" });
    }

    if (
      momoAmt > 0 &&
      (!momoPhone || String(momoPhone).replace(/\D/g, "").length < 10)
    ) {
      return res
        .status(400)
        .json({ error: "Valid MoMo phone number required for remainder" });
    }

    let walletDeducted = false;
    let momoReferenceId: string | undefined;

    if (walletAmt > 0) {
      const deductRes = await fetch(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/api/user/deduct-from-wallet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.cookie || "",
          },
          body: JSON.stringify({ amount: walletAmt }),
        }
      );

      const deductData = await deductRes.json();

      if (!deductRes.ok) {
        return res.status(400).json({
          error: deductData.error || "Wallet deduction failed",
          details: deductData,
        });
      }
      walletDeducted = true;
    }

    if (momoAmt > 0) {
      const momoRes = await fetch(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/api/momo/request-to-pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: momoAmt,
            currency: "RWF",
            payerNumber: momoPhone,
            externalId: orderId || `ORDER-${Date.now()}`,
            payerMessage: "Payment for your order",
            payeeNote: "Thank you for your order",
          }),
        }
      );

      const momoData = (await momoRes.json()) as {
        referenceId?: string;
        error?: string;
      };

      if (!momoRes.ok) {
        if (walletDeducted) {
          await fetch(
            `${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/api/user/add-money-to-wallet`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: req.headers.cookie || "",
              },
              body: JSON.stringify({
                amount: walletAmt,
                description: "Refund: MoMo payment failed",
              }),
            }
          );
        }
        return res.status(400).json({
          error: momoData.error || "MoMo payment failed",
          details: momoData,
        });
      }
      momoReferenceId = momoData.referenceId;
    }

    return res.status(200).json({
      success: true,
      walletAmount: walletAmt,
      momoAmount: momoAmt,
      referenceId: momoReferenceId,
      message:
        momoAmt > 0
          ? "Wallet charged. Approve the MoMo prompt on your phone to complete payment."
          : "Payment completed from wallet.",
    });
  } catch (error) {
    console.error("[process-split-payment] Error:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Payment processing failed",
    });
  }
}
