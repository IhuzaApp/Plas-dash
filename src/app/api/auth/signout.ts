import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Clear any role switching cookies
  res.setHeader("Set-Cookie", [
    "role_changed=; Path=/; Max-Age=0; HttpOnly",
    "new_role=; Path=/; Max-Age=0; HttpOnly",
    "return_to=; Path=/; Max-Age=0; HttpOnly",
  ]);

  if (!session) {
    // If no session, just redirect to login
    return res.redirect("/Auth/Login");
  }

  // Check if this is a role switch
  const isRoleSwitch = req.cookies.role_changed === "true";
  const callbackUrl = isRoleSwitch ? "/" : "/Auth/Login";

  // Redirect to the NextAuth signout endpoint with a callback URL
  return res.redirect(
    `/api/auth/signout?callbackUrl=${encodeURIComponent(callbackUrl)}`
  );
}
