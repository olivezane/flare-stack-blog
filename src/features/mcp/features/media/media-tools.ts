import * as MediaService from "@/features/media/service/media.service";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import type { McpToolDefinition } from "../../service/mcp-tool";
import { defineMcpTool } from "../../service/mcp-tool";
import {
  McpMediaByKeyInputSchema,
  McpMediaDeleteOutputSchema,
  McpMediaListInputSchema,
  McpMediaListOutputSchema,
  McpMediaUsageOutputSchema,
} from "./schema/mcp-media.schema";
import { getMcpMediaUsage, listMcpMedia } from "./service/mcp-media.service";

// ── media_list ──

const MEDIA_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  media: ["read"],
};

const mediaListTool = defineMcpTool({
  name: "media_list",
  description: "List media library items.",
  requiredScopes: MEDIA_LIST_REQUIRED_SCOPES,
  inputSchema: McpMediaListInputSchema,
  outputSchema: McpMediaListOutputSchema,
  async handler(args, context) {
    const result = await listMcpMedia(context, args);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});

// ── media_get_usage ──

const MEDIA_GET_USAGE_REQUIRED_SCOPES: OAuthScopeRequest = {
  media: ["read"],
};

const mediaGetUsageTool = defineMcpTool({
  name: "media_get_usage",
  description: "Show which posts reference one media item.",
  requiredScopes: MEDIA_GET_USAGE_REQUIRED_SCOPES,
  inputSchema: McpMediaByKeyInputSchema,
  outputSchema: McpMediaUsageOutputSchema,
  async handler(args, context) {
    const result = await getMcpMediaUsage(context, args.key);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});

// ── media_delete ──

const MEDIA_DELETE_REQUIRED_SCOPES: OAuthScopeRequest = {
  media: ["write"],
};

const mediaDeleteTool = defineMcpTool({
  name: "media_delete",
  description: "Delete a media item if it is not in use.",
  requiredScopes: MEDIA_DELETE_REQUIRED_SCOPES,
  inputSchema: McpMediaByKeyInputSchema,
  outputSchema: McpMediaDeleteOutputSchema,
  async handler(args, context) {
    const result = await MediaService.deleteImage(context, args.key);

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "MEDIA_IN_USE"
                ? `Media ${args.key} is still referenced by posts`
                : `Media ${args.key} could not be deleted`,
          },
        ],
        isError: true,
      };
    }

    const output = {
      deleted: true as const,
      key: args.key,
    };

    return {
      content: [{ type: "text", text: `Deleted media ${args.key}` }],
      structuredContent: output,
    };
  },
});

export const mcpMediaTools: McpToolDefinition[] = [
  mediaListTool,
  mediaGetUsageTool,
  mediaDeleteTool,
];
