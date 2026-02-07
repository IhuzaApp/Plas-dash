import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

interface DeleteSystemLogsResponse {
  delete_System_Logs: {
    affected_rows: number;
  };
}

const DELETE_OLD_SYSTEM_LOGS = gql`
  mutation DeleteOldSystemLogs {
    delete_System_Logs(
      where: { time: { _lt: "now() - interval '24 hours'" } }
    ) {
      affected_rows
    }
  }
`;

const GET_OLD_LOGS_COUNT = gql`
  query GetOldLogsCount {
    System_Logs_aggregate(
      where: { time: { _lt: "now() - interval '24 hours'" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export async function cleanupOldSystemLogs() {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // First, get count of logs to be deleted
    const countResponse = await hasuraClient.request<{
      System_Logs_aggregate: {
        aggregate: { count: number };
      };
    }>(GET_OLD_LOGS_COUNT);

    const logsToDelete = countResponse.System_Logs_aggregate.aggregate.count;

    if (logsToDelete === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: "No old logs found to delete",
      };
    }

    // Delete logs older than 24 hours
    const response = await hasuraClient.request<DeleteSystemLogsResponse>(
      DELETE_OLD_SYSTEM_LOGS
    );

    const deletedCount = response.delete_System_Logs.affected_rows;

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} logs older than 24 hours`,
    };
  } catch (error) {
    console.error("Failed to cleanup old system logs:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Optional: Add authentication/authorization here
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CLEANUP_API_TOKEN;

  // Skip authentication in development mode (localhost)
  const isDevelopment =
    req.headers.host?.includes("localhost") ||
    req.headers.host?.includes("127.0.0.1");

  if (
    expectedToken &&
    !isDevelopment &&
    authHeader !== `Bearer ${expectedToken}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await cleanupOldSystemLogs();

    if (result.success) {
      return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to cleanup system logs",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
