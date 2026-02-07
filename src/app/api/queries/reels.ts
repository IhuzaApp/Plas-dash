import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Fetch all reels with user and restaurant details
// Optimized: Limited comments (20 most recent), removed individual likes array, removed sensitive user fields
// Uses aggregate count for accurate likes count
const GET_ALL_REELS = gql`
  query GetAllReels($limit: Int, $offset: Int) {
    Reels(order_by: { created_on: desc }, limit: $limit, offset: $offset) {
      id
      category
      created_on
      description
      isLiked
      likes
      restaurant_id
      title
      type
      user_id
      video_url
      delivery_time
      Price
      Product
      shop_id
      Shops {
        name
        id
        image
        description
        address
        latitude
        longitude
      }
      User {
        id
        name
        profile_picture
        role
      }
      Restaurant {
        id
        lat
        location
        long
        name
        profile
        verified
      }
      reel_likes_aggregate {
        aggregate {
          count
        }
      }
      Reels_comments(order_by: { created_on: desc }, limit: 20) {
        user_id
        text
        reel_id
        likes
        isLiked
        id
        created_on
        User {
          id
          name
          profile_picture
          role
        }
      }
    }
  }
`;

// Fetch reels by user ID
// Optimized: Limited comments (20 most recent), removed individual likes array, removed sensitive user fields
// Uses aggregate count for accurate likes count
const GET_REELS_BY_USER = gql`
  query GetReelsByUser($user_id: uuid!, $limit: Int, $offset: Int) {
    Reels(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_on: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      category
      created_on
      description
      isLiked
      likes
      restaurant_id
      title
      type
      user_id
      video_url
      delivery_time
      Price
      Product
      shop_id
      Shops {
        name
        id
        image
        description
        address
        latitude
        longitude
      }
      User {
        id
        name
        profile_picture
        role
      }
      Restaurant {
        id
        lat
        location
        long
        name
        profile
        verified
      }
      reel_likes_aggregate {
        aggregate {
          count
        }
      }
      Reels_comments(order_by: { created_on: desc }, limit: 20) {
        user_id
        text
        reel_id
        likes
        isLiked
        id
        created_on
        User {
          id
          name
          profile_picture
          role
        }
      }
    }
  }
`;

// Fetch reels by restaurant ID
// Optimized: Limited comments (20 most recent), removed individual likes array, removed sensitive user fields
// Uses aggregate count for accurate likes count
const GET_REELS_BY_RESTAURANT = gql`
  query GetReelsByRestaurant($restaurant_id: uuid!, $limit: Int, $offset: Int) {
    Reels(
      where: { restaurant_id: { _eq: $restaurant_id } }
      order_by: { created_on: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      category
      created_on
      description
      isLiked
      likes
      restaurant_id
      title
      type
      user_id
      video_url
      delivery_time
      Price
      Product
      shop_id
      Shops {
        name
        id
        image
        description
        address
        latitude
        longitude
      }
      User {
        id
        name
        profile_picture
        role
      }
      Restaurant {
        id
        lat
        location
        long
        name
        profile
        verified
      }
      reel_likes_aggregate {
        aggregate {
          count
        }
      }
      Reels_comments(order_by: { created_on: desc }, limit: 20) {
        user_id
        text
        reel_id
        likes
        isLiked
        id
        created_on
        User {
          id
          name
          profile_picture
          role
        }
      }
    }
  }
`;

// Create new reel
const CREATE_REEL = gql`
  mutation AddReels(
    $category: String = ""
    $description: String = ""
    $likes: String = ""
    $restaurant_id: uuid = ""
    $title: String = ""
    $type: String = ""
    $video_url: String = ""
    $Product: jsonb = ""
    $delivery_time: String = ""
    $Price: String = ""
    $user_id: uuid = ""
  ) {
    insert_Reels(
      objects: {
        category: $category
        description: $description
        isLiked: false
        likes: $likes
        restaurant_id: $restaurant_id
        title: $title
        type: $type
        video_url: $video_url
        Product: $Product
        delivery_time: $delivery_time
        Price: $Price
        user_id: $user_id
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

// Update reel like status
const UPDATE_REEL_LIKE = gql`
  mutation UpdateReelLike($id: uuid!, $isLiked: Boolean!, $likes: String!) {
    update_Reels_by_pk(
      pk_columns: { id: $id }
      _set: { isLiked: $isLiked, likes: $likes }
    ) {
      id
    }
  }
`;

// Add comment to reel
const ADD_REEL_COMMENT = gql`
  mutation AddReelComment($reel_id: uuid!, $user_id: uuid!, $text: String!) {
    insert_Reels_comments(
      objects: {
        reel_id: $reel_id
        user_id: $user_id
        text: $text
        likes: "0"
        isLiked: false
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

// Update comment like status
const UPDATE_COMMENT_LIKE = gql`
  mutation UpdateCommentLike($id: uuid!, $isLiked: Boolean!, $likes: String!) {
    update_Reels_comments_by_pk(
      pk_columns: { id: $id }
      _set: { isLiked: $isLiked, likes: $likes }
    ) {
      id
    }
  }
`;

interface Reel {
  id: string;
  category: string;
  created_on: string;
  description: string;
  isLiked: boolean;
  likes: string;
  restaurant_id: string | null;
  title: string;
  type: string;
  user_id: string;
  video_url: string;
  delivery_time: string | null;
  Price: string | null;
  Product: any;
  shop_id?: string;
  Shops?: {
    name: string;
    id: string;
    image: string;
    description: string;
    address?: string;
  } | null;
  User: {
    id: string;
    name: string;
    profile_picture: string;
    role: string;
  };
  Restaurant: {
    id: string;
    lat: number;
    location: string;
    long: number;
    name: string;
    profile: string;
    verified: boolean;
  } | null;
  reel_likes_aggregate: {
    aggregate: {
      count: number;
    };
  };
  Reels_comments: Array<{
    user_id: string;
    text: string;
    reel_id: string;
    likes: string;
    isLiked: boolean;
    id: string;
    created_on: string;
    User: {
      id: string;
      name: string;
      profile_picture?: string;
      role: string;
    } | null;
  }>;
}
interface ReelsResponse {
  Reels: Reel[];
}
interface CreateReelResponse {
  insert_Reels: { returning: { id: string }[] };
}
interface AddReelCommentResponse {
  insert_Reels_comments: { returning: { id: string }[] };
}
interface CommentDataResponse {
  Reels_comments: { id: string; isLiked: boolean; likes: string }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!hasuraClient) {
    logger.error("Hasura client is not initialized", "ReelsAPI");
    return res.status(500).json({ error: "Hasura client is not initialized" });
  }

  try {
    const { method } = req;
    switch (method) {
      case "GET":
        await handleGetReels(req, res);
        break;
      case "POST":
        await handleCreateReel(req, res);
        break;
      case "PUT":
        await handleUpdateReel(req, res);
        break;
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    logger.error("Error in reels API", "ReelsAPI", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetReels(req: NextApiRequest, res: NextApiResponse) {
  if (!hasuraClient) {
    return res.status(500).json({ error: "Hasura client not initialized" });
  }
  const { user_id, restaurant_id, type, limit, offset } = req.query;

  // Default limit to 100 reels to prevent 4MB limit
  const limitValue = limit ? parseInt(limit as string) : 100;
  const offsetValue = offset ? parseInt(offset as string) : 0;

  try {
    // Get current user session to determine if reels are liked
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    const currentUserId = session?.user ? (session.user as any).id : null;

    let data: ReelsResponse;

    if (user_id) {
      data = await hasuraClient.request<ReelsResponse>(GET_REELS_BY_USER, {
        user_id: user_id as string,
        limit: limitValue,
        offset: offsetValue,
      });
    } else if (restaurant_id) {
      data = await hasuraClient.request<ReelsResponse>(
        GET_REELS_BY_RESTAURANT,
        {
          restaurant_id: restaurant_id as string,
          limit: limitValue,
          offset: offsetValue,
        }
      );
    } else {
      data = await hasuraClient.request<ReelsResponse>(GET_ALL_REELS, {
        limit: limitValue,
        offset: offsetValue,
      });
    }

    let reels = data.Reels;
    if (type) {
      reels = reels.filter((reel) => reel.type === type);
    }

    // If user is logged in, check which reels they've liked and update isLiked field
    if (currentUserId && reels.length > 0) {
      const reelIds = reels.map((reel) => reel.id);
      const userLikes = await hasuraClient.request<{
        reel_likes: Array<{ reel_id: string }>;
      }>(
        gql`
          query GetUserLikes($user_id: uuid!, $reel_ids: [uuid!]!) {
            reel_likes(
              where: { user_id: { _eq: $user_id }, reel_id: { _in: $reel_ids } }
            ) {
              reel_id
            }
          }
        `,
        { user_id: currentUserId, reel_ids: reelIds }
      );

      const likedReelIds = new Set(
        userLikes.reel_likes.map((like) => like.reel_id)
      );

      // Update isLiked field for each reel
      reels = reels.map((reel) => ({
        ...reel,
        isLiked: likedReelIds.has(reel.id),
      }));
    } else {
      // If not logged in, set all isLiked to false
      reels = reels.map((reel) => ({
        ...reel,
        isLiked: false,
      }));
    }

    // Also fetch user's overall like history to calculate preferences
    // This helps with better personalization even for reels not in current batch
    let userLikeHistory: { [reelId: string]: { type: string } } = {};
    if (currentUserId) {
      try {
        const allUserLikes = await hasuraClient.request<{
          reel_likes: Array<{
            reel_id: string;
            Reels: { type: string } | null;
          }>;
        }>(
          gql`
            query GetUserLikeHistory($user_id: uuid!) {
              reel_likes(
                where: { user_id: { _eq: $user_id } }
                limit: 100
                order_by: { created_at: desc }
              ) {
                reel_id
                Reels {
                  type
                }
              }
            }
          `,
          { user_id: currentUserId }
        );

        allUserLikes.reel_likes.forEach((like) => {
          if (like.Reels?.type) {
            userLikeHistory[like.reel_id] = { type: like.Reels.type };
          }
        });
      } catch (error) {
        logger.error("Error fetching user like history", "ReelsAPI", error);
        // Continue without preference data if this fails
      }
    }

    logger.info(`Found ${reels.length} reels`, "ReelsAPI");

    // Calculate user preferences based on their like history
    const typeCounts: { [type: string]: number } = {};
    let totalLikes = 0;

    Object.values(userLikeHistory).forEach((like) => {
      const type = like.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      totalLikes++;
    });

    const preferences: { [type: string]: number } = {};
    if (totalLikes > 0) {
      Object.keys(typeCounts).forEach((type) => {
        preferences[type] = typeCounts[type] / totalLikes;
      });
    }

    res.status(200).json({
      reels,
      hasMore: reels.length === limitValue,
      userPreferences: preferences, // Include preferences for frontend
    });
  } catch (error) {
    logger.error("Error fetching reels", "ReelsAPI", error);
    res.status(500).json({ error: "Failed to fetch reels" });
  }
}

async function handleCreateReel(req: NextApiRequest, res: NextApiResponse) {
  if (!hasuraClient) {
    return res.status(500).json({ error: "Hasura client not initialized" });
  }
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
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID in session" });
    }

    const {
      category,
      description,
      restaurant_id,
      title,
      type,
      video_url,
      Product,
      delivery_time,
      Price,
    } = req.body;

    if (!title || !video_url || !type) {
      return res.status(400).json({
        error:
          "Missing required fields: title, video_url, and type are required",
      });
    }

    const result = await hasuraClient.request<CreateReelResponse>(CREATE_REEL, {
      category: category || "",
      description: description || "",
      likes: "0",
      restaurant_id: restaurant_id || null,
      title,
      type,
      video_url,
      Product: Product || null,
      delivery_time: delivery_time || null,
      Price: Price || null,
      user_id: userId,
    });

    const newReel = result.insert_Reels.returning[0];
    logger.info("Created new reel", "ReelsAPI", {
      reelId: newReel?.id,
    });
    res.status(201).json({
      success: true,
      reel: newReel,
    });
  } catch (error) {
    logger.error("Error creating reel", "ReelsAPI", error);
    res.status(500).json({ error: "Failed to create reel" });
  }
}

async function handleUpdateReel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, action, comment_id, comment_text } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing reel ID" });
    }

    switch (action) {
      case "toggle_like":
        await handleToggleLike(req, res, id);
        break;
      case "add_comment":
        await handleAddComment(req, res, id, comment_text);
        break;
      case "toggle_comment_like":
        await handleToggleCommentLike(req, res, comment_id);
        break;
      default:
        res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    logger.error("Error updating reel", "ReelsAPI", error);
    res.status(500).json({ error: "Failed to update reel" });
  }
}

async function handleToggleLike(
  req: NextApiRequest,
  res: NextApiResponse,
  reelId: string
) {
  if (!hasuraClient) {
    return res.status(500).json({ error: "Hasura client not initialized" });
  }
  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reelData = await hasuraClient.request<{
      Reels: { id: string; isLiked: boolean; likes: string }[];
    }>(
      gql`
        query GetReel($id: uuid!) {
          Reels(where: { id: { _eq: $id } }) {
            id
            isLiked
            likes
          }
        }
      `,
      { id: reelId }
    );

    if (!reelData.Reels.length) {
      return res.status(404).json({ error: "Reel not found" });
    }

    const reel = reelData.Reels[0];
    const currentLikes = parseInt(reel.likes || "0");
    const newIsLiked = !reel.isLiked;
    const newLikes = newIsLiked
      ? (currentLikes + 1).toString()
      : (currentLikes - 1).toString();

    await hasuraClient.request(UPDATE_REEL_LIKE, {
      id: reelId,
      isLiked: newIsLiked,
      likes: newLikes,
    });

    res.status(200).json({
      success: true,
      isLiked: newIsLiked,
      likes: newLikes,
    });
  } catch (error) {
    logger.error("Error toggling reel like", "ReelsAPI", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
}

async function handleAddComment(
  req: NextApiRequest,
  res: NextApiResponse,
  reelId: string,
  commentText: string
) {
  if (!hasuraClient) {
    return res.status(500).json({ error: "Hasura client not initialized" });
  }
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

    if (!commentText?.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const result = await hasuraClient.request<AddReelCommentResponse>(
      ADD_REEL_COMMENT,
      {
        reel_id: reelId,
        user_id: userId,
        text: commentText.trim(),
      }
    );

    res.status(200).json({
      success: true,
      comment: result.insert_Reels_comments.returning[0],
    });
  } catch (error) {
    logger.error("Error adding comment", "ReelsAPI", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
}

async function handleToggleCommentLike(
  req: NextApiRequest,
  res: NextApiResponse,
  commentId: string
) {
  if (!hasuraClient) {
    return res.status(500).json({ error: "Hasura client not initialized" });
  }
  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const commentData = await hasuraClient.request<CommentDataResponse>(
      gql`
        query GetComment($id: uuid!) {
          Reels_comments(where: { id: { _eq: $id } }) {
            id
            isLiked
            likes
          }
        }
      `,
      { id: commentId }
    );

    if (!commentData.Reels_comments.length) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = commentData.Reels_comments[0];
    const currentLikes = parseInt(comment.likes || "0");
    const newIsLiked = !comment.isLiked;
    const newLikes = newIsLiked
      ? (currentLikes + 1).toString()
      : (currentLikes - 1).toString();

    await hasuraClient.request(UPDATE_COMMENT_LIKE, {
      id: commentId,
      isLiked: newIsLiked,
      likes: newLikes,
    });

    res.status(200).json({
      success: true,
      isLiked: newIsLiked,
      likes: newLikes,
    });
  } catch (error) {
    logger.error("Error toggling comment like", "ReelsAPI", error);
    res.status(500).json({ error: "Failed to toggle comment like" });
  }
}
