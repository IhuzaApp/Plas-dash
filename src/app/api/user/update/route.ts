import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: uuid!
    $name: String!
    $phone: String
    $gender: String
  ) {
    update_Users_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, phone: $phone, gender: $gender, updated_at: "now()" }
    ) {
      id
      name
      email
      phone
      gender
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
  const { name, phone, gender } = body;
  if (!name) {
    return NextResponse.json(
      { message: "Username is required" },
      { status: 400 }
    );
  }
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const result = await hasuraClient.request<{
      update_Users_by_pk: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        gender: string | null;
        updated_at: string;
      };
    }>(UPDATE_USER, {
      id: user_id,
      name,
      phone: phone || null,
      gender: gender || null,
    });
    return NextResponse.json({
      message: "Profile updated successfully",
      user: result.update_Users_by_pk,
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      {
        message: "Failed to update profile",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
