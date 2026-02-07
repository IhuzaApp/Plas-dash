import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("🔑 [MoMo Token API] Starting token request...");
  console.log("🔑 [MoMo Token API] Environment:", process.env.NODE_ENV);
  console.log("🔑 [MoMo Token API] Sandbox URL:", process.env.MOMO_SANDBOX_URL);
  console.log(
    "🔑 [MoMo Token API] Subscription Key configured:",
    !!process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX
  );
  console.log(
    "🔑 [MoMo Token API] API User configured:",
    !!process.env.MOMO_API_USER_SANDBOX
  );
  console.log(
    "🔑 [MoMo Token API] API Key configured:",
    !!process.env.MOMO_API_KEY_SANDBOX
  );

  try {
    const requestHeaders = {
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY_SANDBOX!,
      Authorization: `Basic ${Buffer.from(
        `${process.env.MOMO_API_USER_SANDBOX}:${process.env.MOMO_API_KEY_SANDBOX}`
      ).toString("base64")}`,
    };

    console.log("🔑 [MoMo Token API] Request Headers:", {
      "Ocp-Apim-Subscription-Key": "***HIDDEN***",
      Authorization: "***HIDDEN***",
    });

    const requestUrl = `${process.env.MOMO_SANDBOX_URL}/collection/token/`;
    console.log("🔑 [MoMo Token API] Request URL:", requestUrl);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: requestHeaders,
    });

    console.log("🔑 [MoMo Token API] Response Status:", response.status);
    console.log(
      "🔑 [MoMo Token API] Response Headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [MoMo Token API] Error Response:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log("✅ [MoMo Token API] Success Response:", {
      access_token: data.access_token ? "***TOKEN_RECEIVED***" : "NO_TOKEN",
      token_type: data.token_type,
      expires_in: data.expires_in,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(data); // { access_token, token_type, expires_in }
  } catch (error) {
    console.error("💥 [MoMo Token API] Exception:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: "Token fetch failed" });
  }
}
