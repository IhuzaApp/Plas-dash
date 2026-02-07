import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_PERSONAL_WALLET = gql`
  query GetPersonalWallet($user_id: uuid!) {
    personalWallet(where: { user_id: { _eq: $user_id } }) {
      id
      balance
      user_id
    }
  }
`;

const UPDATE_PERSONAL_WALLET_BALANCE = gql`
  mutation UpdatePersonalWalletBalance($user_id: uuid!, $balance: String!) {
    update_personalWallet_by_pk(
      pk_columns: { user_id: $user_id }
      _set: { balance: $balance, updated_at: "now()" }
    ) {
      id
      balance
      user_id
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = session.user.id;
  const body = await request.json();
  const { amount } = body;
  const deductAmount = parseFloat(amount);
  if (!amount || isNaN(deductAmount) || deductAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  try {
    if (!hasuraClient) {
      throw new Error("Database client not available");
    }
    const walletData = await hasuraClient.request<{
      personalWallet: Array<{ id: string; balance: string }>;
    }>(GET_PERSONAL_WALLET, { user_id });
    const wallet = walletData.personalWallet?.[0];
    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 400 }
      );
    }
    const currentBalance = parseFloat(wallet.balance || "0");
    if (currentBalance < deductAmount) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          available: currentBalance,
          required: deductAmount,
        },
        { status: 400 }
      );
    }
    const newBalance = (currentBalance - deductAmount).toFixed(2);
    await hasuraClient.request(UPDATE_PERSONAL_WALLET_BALANCE, {
      user_id,
      balance: newBalance,
    });
    return NextResponse.json({
      success: true,
      deducted: deductAmount,
      newBalance: parseFloat(newBalance),
    });
  } catch (error) {
    console.error("Error deducting from wallet:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to deduct from wallet",
      },
      { status: 500 }
    );
  }
}
