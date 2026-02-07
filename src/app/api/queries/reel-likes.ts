import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Get likes for a specific reel
const GET_REEL_LIKES = gql`
  query GetReelsLikes($reel_id: uuid = "") {
    reel_likes(where: { reel_id: { _eq: $reel_id } }) {
      created_at
      id
      reel_id
      user_id
    }
  }
`;

// Add like to reel
const ADD_REEL_LIKE = gql`
  mutation AddReelLike($reel_id: uuid!, $user_id: uuid!) {
    insert_reel_likes(objects: { reel_id: $reel_id, user_id: $user_id }) {
      affected_rows
      returning {
        id
        reel_id
        user_id
        created_at
      }
    }
  }
`;

// Remove like from reel
const REMOVE_REEL_LIKE = gql`
  mutation RemoveReelLike($reel_id: uuid!, $user_id: uuid!) {
    delete_reel_likes(
      where: { reel_id: { _eq: $reel_id }, user_id: { _eq: $user_id } }
    ) {
      affected_rows
    }
  }
`;

// Check if user has liked a reel
const CHECK_USER_LIKE = gql`
  query CheckUserLike($reel_id: uuid!, $user_id: uuid!) {
    reel_likes(
      where: { reel_id: { _eq: $reel_id }, user_id: { _eq: $user_id } }
    ) {
      id
      user_id
      reel_id
    }
  }
`;

interface ReelLikesResponse {
  reel_likes: Array<{
    created_at: string;
    id: string;
    reel_id: string;
    user_id: string;
  }>;
}

interface AddLikeResponse {
  insert_reel_likes: {
    affected_rows: number;
    returning: Array<{
      id: string;
      reel_id: string;
      user_id: string;
      created_at: string;
    }>;
  };
}

interface RemoveLikeResponse {
  delete_reel_likes: {
    affected_rows: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const { method } = req;

    switch (method) {
      case "GET":
        await handleGetLikes(req, res);
        break;
      case "POST":
        await handleAddLike(req, res);
        break;
      case "DELETE":
        await handleRemoveLike(req, res);
        break;
      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    logger.error("Error in reel likes API", "ReelLikesAPI", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetLikes(req: NextApiRequest, res: NextApiResponse) {
  const { reel_id } = req.query;

  if (!reel_id) {
    return res.status(400).json({ error: "Missing reel_id parameter" });
  }

  try {
    const data = await hasuraClient.request<ReelLikesResponse>(GET_REEL_LIKES, {
      reel_id: reel_id as string,
    });

    res.status(200).json({
      likes: data.reel_likes,
      count: data.reel_likes.length,
    });
  } catch (error) {
    logger.error("Error fetching reel likes", "ReelLikesAPI", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
}

async function handleAddLike(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as any).id;
    const { reel_id } = req.body;

    if (!reel_id) {
      return res.status(400).json({ error: "Missing reel_id" });
    }

    // Check if user already liked this reel
    const existingLike = await hasuraClient.request<ReelLikesResponse>(
      CHECK_USER_LIKE,
      { reel_id, user_id: userId }
    );

    if (existingLike.reel_likes.length > 0) {
      return res.status(400).json({ error: "User already liked this reel" });
    }

    // Add the like
    const result = await hasuraClient.request<AddLikeResponse>(ADD_REEL_LIKE, {
      reel_id,
      user_id: userId,
    });

    logger.info("Added reel like", "ReelLikesAPI", { reel_id, userId });
    res.status(201).json({
      success: true,
      like: result.insert_reel_likes.returning[0],
    });
  } catch (error) {
    logger.error("Error adding reel like", "ReelLikesAPI", error);
    res.status(500).json({ error: "Failed to add like" });
  }
}

async function handleRemoveLike(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as any).id;
    const { reel_id } = req.body;

    if (!reel_id) {
      return res.status(400).json({ error: "Missing reel_id" });
    }

    // Remove the like
    const result = await hasuraClient.request<RemoveLikeResponse>(
      REMOVE_REEL_LIKE,
      {
        reel_id,
        user_id: userId,
      }
    );

    if (result.delete_reel_likes.affected_rows === 0) {
      return res.status(404).json({ error: "Like not found" });
    }

    logger.info("Removed reel like", "ReelLikesAPI", { reel_id, userId });
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error removing reel like", "ReelLikesAPI", error);
    res.status(500).json({ error: "Failed to remove like" });
  }
}
