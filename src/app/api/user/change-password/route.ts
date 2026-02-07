import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";
import bcrypt from "bcryptjs";

const GET_USER_PASSWORD = gql`
  query GetUserPassword($id: uuid!) {
    Users_by_pk(id: $id) {
      id
      password_hash
    }
  }
`;

const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword($id: uuid!, $password_hash: String!) {
    update_Users_by_pk(
      pk_columns: { id: $id }
      _set: { password_hash: $password_hash, updated_at: "now()" }
    ) {
      id
      updated_at
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = (session.user as { id?: string }).id as string;
  const body = await request.json();
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "Both current and new passwords are required" },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters long" },
      { status: 400 }
    );
  }
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const userData = await hasuraClient.request<{
      Users_by_pk: { id: string; password_hash: string } | null;
    }>(GET_USER_PASSWORD, { id: user_id });
    if (!userData.Users_by_pk?.password_hash) {
      return NextResponse.json(
        { message: "User not found or password not set" },
        { status: 404 }
      );
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userData.Users_by_pk.password_hash
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 401 }
      );
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await hasuraClient.request(UPDATE_USER_PASSWORD, {
      id: user_id,
      password_hash: hashedPassword,
    });
    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      {
        message: "Failed to update password",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
