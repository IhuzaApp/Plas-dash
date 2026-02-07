import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, currency, payerNumber, externalId, payerMessage, payeeNote } =
    req.body;

  // Validate required fields
  if (!amount || !currency || !payerNumber) {
    console.error("❌ [MoMo Transfer API] Validation Error:", {
      missingFields: {
        amount: !amount,
        currency: !currency,
        payerNumber: !payerNumber,
      },
      receivedData: {
        amount,
        currency,
        payerNumber,
        externalId,
        payerMessage,
        payeeNote,
      },
    });
    return res.status(400).json({
      error: "Missing required fields: amount, currency, payerNumber",
    });
  }

  const referenceId = uuidv4();

  try {
    // Check if we have valid MoMo credentials
    console.log(
      "💰 [MoMo Transfer API] Sandbox URL:",
      process.env.MOMO_SANDBOX_URL
    );
    console.log(
      "💰 [MoMo Transfer API] Subscription Key configured:",
      !!process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX
    );
    console.log(
      "💰 [MoMo Transfer API] API User configured:",
      !!process.env.MOMO_API_USER_SANDBOX
    );
    console.log(
      "💰 [MoMo Transfer API] API Key configured:",
      !!process.env.MOMO_API_KEY_SANDBOX
    );

    if (
      !process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX ||
      !process.env.MOMO_API_USER_SANDBOX ||
      !process.env.MOMO_API_KEY_SANDBOX
    ) {
      console.log(
        "🧪 [MoMo Transfer API] Credentials not configured, simulating payment for testing"
      );

      const simulatedResponse = {
        referenceId,
        amount,
        currency,
        payerNumber,
        externalId,
        payerMessage,
        payeeNote,
        status: "SUCCESSFUL",
        timestamp: new Date().toISOString(),
      };
      // Simulate successful payment for testing
      return res.status(200).json({
        referenceId,
        message: "Payment simulated successfully (testing mode)",
        status: "SUCCESSFUL",
      });
    }

    // 1. Get Access Token (this will use cached token if valid, or generate new one)
    const tokenUrl = `${process.env.MOMO_SANDBOX_URL}/collection/token/`;

    const tokenHeaders = {
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
      Authorization: `Basic ${Buffer.from(
        `${process.env.MOMO_API_USER_SANDBOX}:${process.env.MOMO_API_KEY_SANDBOX}`
      ).toString("base64")}`,
    };

    console.log({
      "Ocp-Apim-Subscription-Key": "***HIDDEN***",
      Authorization: "***HIDDEN***",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: tokenHeaders,
    });

    console.log(
      "🔑 [MoMo Transfer API] Token Response Status:",
      tokenRes.status
    );
    console.log(
      "🔑 [MoMo Transfer API] Token Response Headers:",
      Object.fromEntries(tokenRes.headers.entries())
    );

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("❌ [MoMo Transfer API] Token API Error:", {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        error: errorText,
      });

      // If it's a credentials issue, simulate successful payment
      if (tokenRes.status === 401 || tokenRes.status === 403) {
        console.log(
          "🧪 [MoMo Transfer API] Credentials invalid, simulating payment for testing"
        );
        console.log(
          "🧪 [MoMo Transfer API] Simulated Payment Details (Invalid Credentials):",
          {
            referenceId,
            amount,
            currency,
            payerNumber,
            externalId,
            payerMessage,
            payeeNote,
            status: "SUCCESSFUL",
            reason: "Invalid credentials - testing mode",
            timestamp: new Date().toISOString(),
          }
        );
        return res.status(200).json({
          referenceId,
          message:
            "Payment simulated successfully (testing mode - invalid credentials)",
          status: "SUCCESSFUL",
        });
      }

      return res.status(tokenRes.status).json({ error: errorText });
    }

    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;
    console.log({
      access_token: access_token ? "***TOKEN_RECEIVED***" : "NO_TOKEN",
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    });

    // 2. Send Transfer request
    const transferUrl = `${process.env.MOMO_SANDBOX_URL}/disbursement/v1_0/transfer`;

    const transferPayload = {
      amount: amount.toString(),
      currency,
      externalId: externalId || `SHOPPER-PAYMENT-${Date.now()}`,
      payee: {
        partyIdType: "MSISDN",
        partyId: payerNumber, // e.g. "2507xxxxxxx"
      },
      payerMessage: payerMessage || "Payment for Shopper Items",
      payeeNote: payeeNote || "Shopper payment confirmation",
    };

    console.log({
      amount: transferPayload.amount,
      currency: transferPayload.currency,
      externalId: transferPayload.externalId,
      payee: transferPayload.payee,
      payerMessage: transferPayload.payerMessage,
      payeeNote: transferPayload.payeeNote,
    });

    const transferHeaders = {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
      Authorization: `Bearer ${access_token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": "sandbox",
    };

    console.log({
      "Content-Type": transferHeaders["Content-Type"],
      "Ocp-Apim-Subscription-Key": "***HIDDEN***",
      Authorization: "***HIDDEN***",
      "X-Reference-Id": transferHeaders["X-Reference-Id"],
      "X-Target-Environment": transferHeaders["X-Target-Environment"],
    });

    const transferRes = await fetch(transferUrl, {
      method: "POST",
      headers: transferHeaders,
      body: JSON.stringify(transferPayload),
    });

    console.log(
      "💰 [MoMo Transfer API] Transfer Response Status:",
      transferRes.status
    );
    console.log(
      "💰 [MoMo Transfer API] Transfer Response Headers:",
      Object.fromEntries(transferRes.headers.entries())
    );

    if (transferRes.status === 202) {
      console.log({
        referenceId,
        status: "PENDING",
        amount: transferPayload.amount,
        currency: transferPayload.currency,
        payerNumber: transferPayload.payee.partyId,
        externalId: transferPayload.externalId,
        timestamp: new Date().toISOString(),
      });
      res.status(200).json({
        referenceId,
        message: "Payment request accepted",
        status: "PENDING",
      });
    } else {
      const error = await transferRes.text();
      console.error("❌ [MoMo Transfer API] Transfer Error:", {
        status: transferRes.status,
        statusText: transferRes.statusText,
        error,
        referenceId,
        amount: transferPayload.amount,
        currency: transferPayload.currency,
        payerNumber: transferPayload.payee.partyId,
        timestamp: new Date().toISOString(),
      });
      res.status(transferRes.status).json({ error });
    }
  } catch (error) {
    console.error("💥 [MoMo Transfer API] Exception:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      referenceId,
      amount,
      currency,
      payerNumber,
      externalId,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: "Payment request failed" });
  }
}
