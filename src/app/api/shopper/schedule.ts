import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { logger } from "../../../src/utils/logger";
import { authOptions } from "../auth/[...nextauth]";

interface ScheduleResponse {
  Shopper_Availability: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

interface DeleteScheduleResponse {
  delete_Shopper_Availability: {
    affected_rows: number;
  };
}

interface InsertScheduleResponse {
  insert_Shopper_Availability: {
    affected_rows: number;
    returning: Array<{
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }>;
  };
}

const GET_SCHEDULE = gql`
  query GetShopperSchedule($userId: uuid!) {
    Shopper_Availability(
      where: { user_id: { _eq: $userId } }
      order_by: { day_of_week: asc }
    ) {
      id
      day_of_week
      start_time
      end_time
      is_available
      created_at
      updated_at
    }
  }
`;

const DELETE_EXISTING_SCHEDULE = gql`
  mutation DeleteExistingSchedule($userId: uuid!) {
    delete_Shopper_Availability(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

const INSERT_SCHEDULE = gql`
  mutation InsertSchedule($schedules: [Shopper_Availability_insert_input!]!) {
    insert_Shopper_Availability(objects: $schedules) {
      affected_rows
      returning {
        id
        day_of_week
        start_time
        end_time
        is_available
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let session: any = null;

  try {
    logger.info("Schedule API request received", "ScheduleAPI", {
      method: req.method,
    });

    session = await getServerSession(req, res, authOptions);

    if (!session) {
      logger.error("No session found", "ScheduleAPI");
      return res.status(401).json({ error: "Unauthorized - No session found" });
    }

    const userId = session.user?.id;

    if (!userId) {
      logger.error("No user ID in session", "ScheduleAPI");
      return res.status(401).json({ error: "Unauthorized - No user ID found" });
    }

    if (!hasuraClient) {
      logger.error("Hasura client not initialized", "ScheduleAPI");
      throw new Error("Hasura client is not initialized");
    }

    if (req.method === "GET") {
      logger.info("Processing GET request", "ScheduleAPI", { userId });

      const data = await hasuraClient.request<ScheduleResponse>(GET_SCHEDULE, {
        userId,
      });

      logger.info("Schedule query result:", "ScheduleAPI", {
        userId,
        scheduleCount: data.Shopper_Availability.length,
      });

      return res.status(200).json({
        schedule: data.Shopper_Availability,
        hasSchedule: data.Shopper_Availability.length > 0,
      });
    } else if (req.method === "POST") {
      logger.info("Processing POST request", "ScheduleAPI", { userId });

      const { schedule } = req.body;

      logger.info("Received schedule data:", "ScheduleAPI", {
        scheduleType: typeof schedule,
        scheduleLength: Array.isArray(schedule) ? schedule.length : "not array",
        firstItem:
          Array.isArray(schedule) && schedule.length > 0
            ? schedule[0]
            : "no items",
      });

      if (!Array.isArray(schedule)) {
        logger.error("Invalid schedule format", "ScheduleAPI", {
          receivedType: typeof schedule,
        });
        return res.status(400).json({ error: "Invalid schedule format" });
      }

      const scheduleInput = schedule.map((slot) => {
        // Convert time format from HH:MM:SS+00:00 to HH:MM:SS+00 for PostgreSQL compatibility
        const formatTimeForDB = (time: string) => {
          if (time.includes("+00:00")) {
            return time.replace("+00:00", "+00");
          }
          return time;
        };

        return {
          user_id: userId,
          day_of_week: slot.day_of_week,
          start_time: formatTimeForDB(slot.start_time),
          end_time: formatTimeForDB(slot.end_time),
          is_available: slot.is_available,
        };
      });

      logger.info("Upserting schedule", "ScheduleAPI", {
        userId,
        scheduleCount: scheduleInput.length,
        firstScheduleItem: scheduleInput[0],
      });

      // First, delete existing schedule for this user
      logger.info("Deleting existing schedule", "ScheduleAPI", { userId });

      const deleteResult = await hasuraClient.request<DeleteScheduleResponse>(
        DELETE_EXISTING_SCHEDULE,
        { userId }
      );

      logger.info("Delete result:", "ScheduleAPI", {
        userId,
        deletedRows: deleteResult.delete_Shopper_Availability.affected_rows,
      });

      // Then insert the new schedule
      logger.info("Inserting new schedule", "ScheduleAPI", {
        userId,
        scheduleCount: scheduleInput.length,
      });

      const insertResult = await hasuraClient.request<InsertScheduleResponse>(
        INSERT_SCHEDULE,
        {
          schedules: scheduleInput,
        }
      );

      logger.info("Insert result:", "ScheduleAPI", {
        userId,
        insertedRows: insertResult.insert_Shopper_Availability.affected_rows,
      });

      return res.status(200).json({
        success: true,
        affected_rows: insertResult.insert_Shopper_Availability.affected_rows,
      });
    }

    logger.warn("Method not allowed", "ScheduleAPI", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    logger.error("Error in schedule API:", "ScheduleAPI", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id,
      method: req.method,
      body: req.body,
    });
    return res.status(500).json({
      error: "Failed to process schedule request",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
