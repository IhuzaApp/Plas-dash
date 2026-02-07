import { NextResponse } from "next/server";
import { logErrorToSlack } from "@/lib/slackErrorReporter";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { where, message, stack, extra } = body;
    if (!where || !message) {
      return NextResponse.json(
        { error: "Missing required fields: where and message" },
        { status: 400 }
      );
    }
    const err =
      stack && message
        ? Object.assign(new Error(message), { stack })
        : new Error(message);
    await logErrorToSlack(
      where,
      err,
      extra && typeof extra === "object" ? extra : undefined
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to report error" },
      { status: 500 }
    );
  }
}
