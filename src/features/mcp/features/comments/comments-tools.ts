import * as CommentService from "@/features/comments/comments.service";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import type { McpToolDefinition } from "../../service/mcp-tool";
import { defineMcpTool } from "../../service/mcp-tool";
import {
  McpCommentByIdInputSchema,
  McpCommentDeleteOutputSchema,
  McpCommentStatusUpdateInputSchema,
  McpCommentStatusUpdateOutputSchema,
  McpCommentsListInputSchema,
  McpCommentsListOutputSchema,
} from "./schema/mcp-comments.schema";
import { listMcpComments } from "./service/mcp-comments.service";

// ── comments_list ──

const COMMENTS_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  comments: ["read"],
};

const commentsListTool = defineMcpTool({
  name: "comments_list",
  description:
    "List comments with moderation context such as post metadata and reply previews.",
  requiredScopes: COMMENTS_LIST_REQUIRED_SCOPES,
  inputSchema: McpCommentsListInputSchema,
  outputSchema: McpCommentsListOutputSchema,
  async handler(args, context) {
    const result = await listMcpComments(context, args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result,
    };
  },
});

// ── comments_delete ──

const COMMENTS_DELETE_REQUIRED_SCOPES: OAuthScopeRequest = {
  comments: ["write"],
};

const commentsDeleteTool = defineMcpTool({
  name: "comments_delete",
  description: "Delete a comment permanently.",
  requiredScopes: COMMENTS_DELETE_REQUIRED_SCOPES,
  inputSchema: McpCommentByIdInputSchema,
  outputSchema: McpCommentDeleteOutputSchema,
  async handler(args, context) {
    const comment = await CommentService.findCommentById(context, args.id);
    if (!comment) {
      return {
        content: [{ type: "text", text: `Comment ${args.id} not found` }],
        isError: true,
      };
    }

    const deleteResult = await CommentService.adminDeleteComment(context, args);
    if (deleteResult.error) {
      return {
        content: [
          {
            type: "text",
            text: `Comment ${args.id} could not be deleted`,
          },
        ],
        isError: true,
      };
    }

    const payload = {
      deleted: true as const,
      id: comment.id,
      previousStatus: comment.status,
      postId: comment.postId,
    };

    return {
      content: [
        {
          type: "text",
          text: `Deleted comment ${args.id}`,
        },
      ],
      structuredContent: payload,
    };
  },
});

// ── comments_set_status ──

const COMMENTS_SET_STATUS_REQUIRED_SCOPES: OAuthScopeRequest = {
  comments: ["write"],
};

const commentsSetStatusTool = defineMcpTool({
  name: "comments_set_status",
  description: "Update a comment moderation status.",
  requiredScopes: COMMENTS_SET_STATUS_REQUIRED_SCOPES,
  inputSchema: McpCommentStatusUpdateInputSchema,
  outputSchema: McpCommentStatusUpdateOutputSchema,
  async handler(args, context) {
    const comment = await CommentService.findCommentById(context, args.id);
    if (!comment) {
      return {
        content: [{ type: "text", text: `Comment ${args.id} not found` }],
        isError: true,
      };
    }

    const result = await CommentService.moderateComment(context, args);
    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text: `Comment ${args.id} could not be updated`,
          },
        ],
        isError: true,
      };
    }

    const payload = {
      id: result.data.id,
      previousStatus: comment.status,
      status: result.data.status,
      postId: result.data.postId,
    };

    return {
      content: [
        {
          type: "text",
          text: `Updated comment ${args.id} status to ${result.data.status}`,
        },
      ],
      structuredContent: payload,
    };
  },
});

export const mcpCommentsTools: McpToolDefinition[] = [
  commentsListTool,
  commentsDeleteTool,
  commentsSetStatusTool,
];
