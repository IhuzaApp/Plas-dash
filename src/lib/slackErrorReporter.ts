const SLACK_ERRORS_WEBHOOK = process.env.SLACK_ERRORS_WEBHOOK;

type ExtraContext = Record<string, unknown>;

/**
 * Send a concise error notification to Slack using the SLACK_ERRORS_WEBHOOK.
 * Designed for server-side usage only (API routes, backend utilities).
 */
export async function logErrorToSlack(
  where: string,
  error: unknown,
  extra?: ExtraContext
) {
  if (!SLACK_ERRORS_WEBHOOK) {
    // Avoid throwing if Slack isn't configured; just log locally
    // so we don't break the main request flow.
    console.error("SLACK_ERRORS_WEBHOOK is not configured");
    return;
  }

  const err =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };

  // Build a safe, trimmed payload (avoid sending full request bodies or secrets)
  const trimmedExtra =
    extra && Object.keys(extra).length > 0
      ? JSON.parse(
          JSON.stringify(extra, (_, value) =>
            typeof value === "string" && value.length > 500
              ? value.slice(0, 500) + "…"
              : value
          )
        )
      : undefined;

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚨 Server Error",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Location*\n\`${where}\`` },
        {
          type: "mrkdwn",
          text: `*Environment*\n\`${process.env.NODE_ENV || "unknown"}\``,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message*\n\`${err.message}\``,
      },
    },
    ...(trimmedExtra
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "*Context*\n```" +
                JSON.stringify(trimmedExtra, null, 2).slice(0, 1200) +
                "```",
            },
          },
        ]
      : []),
    ...(err.stack
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "*Stack (top)*\n```" +
                String(err.stack)
                  .split("\n")
                  .slice(0, 10)
                  .join("\n")
                  .slice(0, 1200) +
                "```",
            },
          },
        ]
      : []),
    { type: "divider" },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `🕒 ${new Date().toISOString()}` },
        { type: "mrkdwn", text: `🧩 Service: ${where}` },
      ],
    },
  ];

  try {
    await fetch(SLACK_ERRORS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Error in ${where}: ${err.message}`,
        blocks,
      }),
    });
  } catch (sendError) {
    // Last resort: log locally; don't throw
    console.error("Failed to send error to Slack", sendError);
  }
}
