import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Add comment to reel
const ADD_REEL_COMMENT = gql`
  mutation addReelComment(
    $likes: String = ""
    $reel_id: uuid = ""
    $text: String = ""
    $user_id: uuid = ""
  ) {
    insert_Reels_comments(
      objects: {
        isLiked: false
        likes: $likes
        reel_id: $reel_id
        text: $text
        user_id: $user_id
      }
    ) {
      affected_rows
      returning {
        id
        user_id
        text
        reel_id
        likes
        isLiked
        created_on
        User {
          email
          gender
          name
          phone
          profile_picture
        }
      }
    }
  }
`;

// Get all comments
const GET_ALL_COMMENTS = gql`
  query GetComments {
    Reels_comments(order_by: { created_on: desc }) {
      user_id
      text
      reel_id
      likes
      isLiked
      id
      created_on
      User {
        email
        gender
        name
        phone
        profile_picture
      }
      Reel {
        category
        isLiked
        likes
        restaurant_id
        title
        id
      }
    }
  }
`;

// Get comments by reel ID
const GET_COMMENTS_BY_REEL = gql`
  query GetCommentsWhereReelID($reel_id: uuid = "") {
    Reels_comments(
      where: { reel_id: { _eq: $reel_id } }
      order_by: { created_on: desc }
    ) {
      user_id
      text
      reel_id
      likes
      isLiked
      id
      created_on
      User {
        email
        gender
        name
        phone
        profile_picture
      }
      Reel {
        category
        isLiked
        likes
        restaurant_id
        title
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
      isLiked
      likes
    }
  }
`;

// Delete comment
const DELETE_COMMENT = gql`
  mutation DeleteComment($id: uuid!) {
    delete_Reels_comments_by_pk(id: $id) {
      id
    }
  }
`;

interface CommentResponse {
  Reels_comments: Array<{
    user_id: string;
    text: string;
    reel_id: string;
    likes: string;
    isLiked: boolean;
    id: string;
    created_on: string;
    User: {
      email: string;
      gender: string;
      name: string;
      phone: string;
      profile_picture: string;
    };
    Reel: {
      category: string;
      isLiked: boolean;
      likes: string;
      restaurant_id: string | null;
      title: string;
      id: string;
    };
  }>;
}

interface AddCommentResponse {
  insert_Reels_comments: {
    affected_rows: number;
    returning: Array<{
      id: string;
      user_id: string;
      text: string;
      reel_id: string;
      likes: string;
      isLiked: boolean;
      created_on: string;
      User: {
        email: string;
        gender: string;
        name: string;
        phone: string;
        profile_picture: string;
      };
    }>;
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
        await handleGetComments(req, res);
        break;
      case "POST":
        await handleAddComment(req, res);
        break;
      case "PUT":
        await handleUpdateComment(req, res);
        break;
      case "DELETE":
        await handleDeleteComment(req, res);
        break;
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    logger.error("Error in reel comments API", "ReelCommentsAPI", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetComments(req: NextApiRequest, res: NextApiResponse) {
  const { reel_id } = req.query;

  try {
    let data: CommentResponse;

    if (reel_id) {
      // Get comments for specific reel
      data = await hasuraClient.request<CommentResponse>(GET_COMMENTS_BY_REEL, {
        reel_id: reel_id as string,
      });
    } else {
      // Get all comments
      data = await hasuraClient.request<CommentResponse>(GET_ALL_COMMENTS);
    }

    logger.info(
      `Found ${data.Reels_comments.length} comments`,
      "ReelCommentsAPI"
    );
    res.status(200).json({ comments: data.Reels_comments });
  } catch (error) {
    logger.error("Error fetching comments", "ReelCommentsAPI", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
}

async function handleAddComment(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the user ID from the session
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

    const { reel_id, text } = req.body;

    if (!reel_id || !text?.trim()) {
      return res.status(400).json({
        error: "Missing required fields: reel_id and text are required",
      });
    }

    const result = await hasuraClient.request<AddCommentResponse>(
      ADD_REEL_COMMENT,
      {
        likes: "0",
        reel_id,
        text: text.trim(),
        user_id: userId,
      }
    );

    logger.info("Added new comment", "ReelCommentsAPI", {
      commentId: result.insert_Reels_comments.returning[0]?.id,
      reelId: reel_id,
    });

    res.status(201).json({
      success: true,
      comment: result.insert_Reels_comments.returning[0],
    });
  } catch (error) {
    logger.error("Error adding comment", "ReelCommentsAPI", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
}

async function handleUpdateComment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { comment_id, action } = req.body;

    if (!comment_id) {
      return res.status(400).json({ error: "Missing comment ID" });
    }

    switch (action) {
      case "toggle_like":
        await handleToggleCommentLike(req, res, comment_id);
        break;
      default:
        res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    logger.error("Error updating comment", "ReelCommentsAPI", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
}

async function handleToggleCommentLike(
  req: NextApiRequest,
  res: NextApiResponse,
  commentId: string
) {
  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get current comment data
    const commentData = await hasuraClient.request<CommentResponse>(
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

    const result = await hasuraClient.request(UPDATE_COMMENT_LIKE, {
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
    logger.error("Error toggling comment like", "ReelCommentsAPI", error);
    res.status(500).json({ error: "Failed to toggle comment like" });
  }
}

async function handleDeleteComment(req: NextApiRequest, res: NextApiResponse) {
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
    const { comment_id } = req.body;

    if (!comment_id) {
      return res.status(400).json({ error: "Missing comment ID" });
    }

    // Verify the comment belongs to the user or user has admin rights
    const commentData = await hasuraClient.request<CommentResponse>(
      gql`
        query GetComment($id: uuid!) {
          Reels_comments(where: { id: { _eq: $id } }) {
            id
            user_id
            text
          }
        }
      `,
      { id: comment_id }
    );

    if (!commentData.Reels_comments.length) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = commentData.Reels_comments[0];

    // Check if user owns the comment or has admin role
    const userRole = (session.user as any).role;
    if (comment.user_id !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    const result = await hasuraClient.request(DELETE_COMMENT, {
      id: comment_id,
    });

    logger.info("Deleted comment", "ReelCommentsAPI", {
      commentId: comment_id,
    });
    res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    logger.error("Error deleting comment", "ReelCommentsAPI", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
}
