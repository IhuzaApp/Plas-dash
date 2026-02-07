import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

/**
 * MoMo Collection API - RequestToPay
 * Collects payment FROM the customer (payer) to the merchant.
 * Use this for checkout when charging the customer's MoMo.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    amount,
    currency = "RWF",
    payerNumber,
    externalId,
    payerMessage = "Payment for your order",
    payeeNote = "Thank you for your order",
  } = req.body;

  if (!amount || !payerNumber) {
    return res.status(400).json({
      error: "Missing required fields: amount, payerNumber",
    });
  }

  const amt = Math.round(parseFloat(amount) * 100) / 100;
  if (amt <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  // Normalize phone to MSISDN (250... for Rwanda)
  let partyId = String(payerNumber).replace(/\D/g, "");
  if (partyId.startsWith("0")) {
    partyId = "250" + partyId.slice(1);
  } else if (!partyId.startsWith("250")) {
    partyId = "250" + partyId;
  }

  const referenceId = uuidv4();
  const extId = externalId || `ORDER-${Date.now()}`;

  try {
    const hasCredentials =
      process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX &&
      process.env.MOMO_API_USER_SANDBOX &&
      process.env.MOMO_API_KEY_SANDBOX;

    if (!hasCredentials) {
      return res.status(200).json({
        referenceId,
        message: "Payment simulated (sandbox)",
        status: "PENDING",
      });
    }

    const tokenUrl = `${process.env.MOMO_SANDBOX_URL}/collection/token/`;
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
        Authorization: `Basic ${Buffer.from(
          `${process.env.MOMO_API_USER_SANDBOX}:${process.env.MOMO_API_KEY_SANDBOX}`
        ).toString("base64")}`,
      },
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[MoMo RequestToPay] Token error:", errText);
      return res.status(200).json({
        referenceId,
        message: "Payment simulated (token error)",
        status: "PENDING",
      });
    }

    const { access_token } = await tokenRes.json();

    const requestToPayUrl = `${process.env.MOMO_SANDBOX_URL}/collection/v1_0/requesttopay`;
    const payload = {
      amount: amt.toFixed(2),
      currency,
      externalId: extId,
      payer: {
        partyIdType: "MSISDN",
        partyId,
      },
      payerMessage,
      payeeNote,
    };

    const payRes = await fetch(requestToPayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
        Authorization: `Bearer ${access_token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": "sandbox",
      },
      body: JSON.stringify(payload),
    });

    if (payRes.status === 202) {
      return res.status(200).json({
        referenceId,
        message: "Payment request sent – approve on your phone",
        status: "PENDING",
      });
    }

    const errBody = await payRes.text();
    console.error("[MoMo RequestToPay] Error:", payRes.status, errBody);
    return res.status(payRes.status || 500).json({
      error: "MoMo request failed",
      details: errBody,
      referenceId,
    });
  } catch (error) {
    console.error("[MoMo RequestToPay] Exception:", error);
    return res.status(500).json({
      error: "Payment request failed",
      referenceId,
    });
  }
}
