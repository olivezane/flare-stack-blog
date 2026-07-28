import * as FriendLinkService from "@/features/friend-links/friend-links.service";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import type { McpToolDefinition } from "../../service/mcp-tool";
import { defineMcpTool } from "../../service/mcp-tool";
import {
  McpFriendLinkByIdInputSchema,
  McpFriendLinkCreateInputSchema,
  McpFriendLinkDeleteOutputSchema,
  McpFriendLinkSchema,
  McpFriendLinksListInputSchema,
  McpFriendLinksListOutputSchema,
  McpFriendLinkUpdateInputSchema,
} from "./schema/mcp-friend-links.schema";
import { serializeMcpFriendLink } from "./service/mcp-friend-links.service";

// ── friend_links_list ──

const FRIEND_LINKS_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  "friend-links": ["read"],
};

const friendLinksListTool = defineMcpTool({
  name: "friend_links_list",
  description: "List friend links with moderation status.",
  requiredScopes: FRIEND_LINKS_LIST_REQUIRED_SCOPES,
  inputSchema: McpFriendLinksListInputSchema,
  outputSchema: McpFriendLinksListOutputSchema,
  async handler(args, context) {
    const result = await FriendLinkService.getAllFriendLinks(context, args);
    const items = result.items.map(serializeMcpFriendLink);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ items, total: result.total }, null, 2),
        },
      ],
      structuredContent: {
        items,
        total: result.total,
      },
    };
  },
});

// ── friend_links_create ──

const FRIEND_LINKS_CREATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  "friend-links": ["write"],
};

const friendLinksCreateTool = defineMcpTool({
  name: "friend_links_create",
  description: "Create an approved friend link entry.",
  requiredScopes: FRIEND_LINKS_CREATE_REQUIRED_SCOPES,
  inputSchema: McpFriendLinkCreateInputSchema,
  outputSchema: McpFriendLinkSchema,
  async handler(args, context) {
    const result = await FriendLinkService.createFriendLink(context, args);
    const output = serializeMcpFriendLink({ ...result, user: null });

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  },
});

// ── friend_links_update ──

const FRIEND_LINKS_UPDATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  "friend-links": ["write"],
};

const friendLinksUpdateTool = defineMcpTool({
  name: "friend_links_update",
  description:
    "Update friend link fields or change moderation status to approved or rejected.",
  requiredScopes: FRIEND_LINKS_UPDATE_REQUIRED_SCOPES,
  inputSchema: McpFriendLinkUpdateInputSchema,
  outputSchema: McpFriendLinkSchema,
  async handler(args, context) {
    const { id, status, rejectionReason, ...updateData } = args;
    const hasFieldUpdates = Object.values(updateData).some(
      (value) => value !== undefined,
    );

    let result:
      | Awaited<ReturnType<typeof FriendLinkService.updateFriendLink>>
      | Awaited<ReturnType<typeof FriendLinkService.approveFriendLink>>
      | Awaited<ReturnType<typeof FriendLinkService.rejectFriendLink>>;

    if (status === "approved") {
      result = await FriendLinkService.approveFriendLink(context, { id });
    } else if (status === "rejected") {
      result = await FriendLinkService.rejectFriendLink(context, {
        id,
        rejectionReason,
      });
    } else {
      result = await FriendLinkService.updateFriendLink(context, {
        id,
        ...updateData,
      });
    }

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "NOT_FOUND"
                ? `Friend link ${id} not found`
                : `Failed to update friend link ${id}`,
          },
        ],
        isError: true,
      };
    }

    const output = serializeMcpFriendLink({ ...result.data, user: null });

    return {
      content: [
        {
          type: "text",
          text:
            status === "approved"
              ? `Approved friend link ${id}`
              : status === "rejected"
                ? `Rejected friend link ${id}`
                : hasFieldUpdates
                  ? JSON.stringify(output, null, 2)
                  : `Updated friend link ${id}`,
        },
      ],
      structuredContent: output,
    };
  },
});

// ── friend_links_delete ──

const FRIEND_LINKS_DELETE_REQUIRED_SCOPES: OAuthScopeRequest = {
  "friend-links": ["write"],
};

const friendLinksDeleteTool = defineMcpTool({
  name: "friend_links_delete",
  description: "Delete a friend link.",
  requiredScopes: FRIEND_LINKS_DELETE_REQUIRED_SCOPES,
  inputSchema: McpFriendLinkByIdInputSchema,
  outputSchema: McpFriendLinkDeleteOutputSchema,
  async handler(args, context) {
    const result = await FriendLinkService.deleteFriendLink(context, args);
    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text: `Friend link ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    const output = {
      deleted: true as const,
      id: args.id,
    };

    return {
      content: [{ type: "text", text: `Deleted friend link ${args.id}` }],
      structuredContent: output,
    };
  },
});

export const mcpFriendLinksTools: McpToolDefinition[] = [
  friendLinksListTool,
  friendLinksCreateTool,
  friendLinksUpdateTool,
  friendLinksDeleteTool,
];
