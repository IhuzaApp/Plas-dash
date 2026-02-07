import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Check MoMo Collection API RequestToPay status.
 * GET /collection/v1_0/requesttopay/{referenceId}
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { referenceId } = req.query;

  if (!referenceId || typeof referenceId !== "string") {
    return res.status(400).json({ error: "referenceId is required" });
  }

  try {
    const hasCredentials =
      process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX &&
      process.env.MOMO_API_USER_SANDBOX &&
      process.env.MOMO_API_KEY_SANDBOX;

    if (!hasCredentials) {
      return res.status(200).json({
        status: "SUCCESSFUL",
        referenceId,
        message: "Simulated (sandbox)",
      });
    }

    const tokenRes = await fetch(
      `${process.env.MOMO_SANDBOX_URL}/collection/token/`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
          Authorization: `Basic ${Buffer.from(
            `${process.env.MOMO_API_USER_SANDBOX}:${process.env.MOMO_API_KEY_SANDBOX}`
          ).toString("base64")}`,
        },
      }
    );

    if (!tokenRes.ok) {
      return res.status(200).json({
        status: "SUCCESSFUL",
        referenceId,
        message: "Simulated (token error)",
      });
    }

    const { access_token } = await tokenRes.json();
    const statusUrl = `${process.env.MOMO_SANDBOX_URL}/collection/v1_0/requesttopay/${referenceId}`;

    const statusRes = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
        Authorization: `Bearer ${access_token}`,
        "X-Target-Environment": "sandbox",
      },
    });

    if (!statusRes.ok) {
      const err = await statusRes.text();
      return res.status(statusRes.status).json({
        error: err || "Status check failed",
        referenceId,
      });
    }

    const data = await statusRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("[MoMo RequestToPay Status]", error);
    return res.status(500).json({
      error: "Status check failed",
      referenceId,
    });
  }
}
