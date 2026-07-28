import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as PostService from "@/features/posts/services/posts.service";
import * as TagService from "@/features/tags/tags.service";
import type { McpToolDefinition } from "../../service/mcp-tool";
import { defineMcpTool } from "../../service/mcp-tool";
import {
  McpPostSetTagsInputSchema,
  McpPostSetTagsOutputSchema,
  McpTagCreateInputSchema,
  McpTagDeleteInputSchema,
  McpTagDeleteOutputSchema,
  McpTagSchema,
  McpTagsListInputSchema,
  McpTagsListOutputSchema,
  McpTagUpdateInputSchema,
} from "./schema/mcp-tags.schema";
import {
  ensureTagIdsByNames,
  serializeMcpTag,
  serializeMcpTagWithCount,
} from "./service/mcp-tags.service";

// ── tags_list ──

const TAGS_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["read"],
};

const tagsListTool = defineMcpTool({
  name: "tags_list",
  description: "List tags used by the blog.",
  requiredScopes: TAGS_LIST_REQUIRED_SCOPES,
  inputSchema: McpTagsListInputSchema,
  outputSchema: McpTagsListOutputSchema,
  async handler(args, context) {
    const tags = await TagService.getTags(context, args);
    const items = tags.map((tag) =>
      "postCount" in tag ? serializeMcpTagWithCount(tag) : serializeMcpTag(tag),
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ items }, null, 2),
        },
      ],
      structuredContent: { items },
    };
  },
});

// ── tags_create ──

const TAGS_CREATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const tagsCreateTool = defineMcpTool({
  name: "tags_create",
  description: "Create a new tag.",
  requiredScopes: TAGS_CREATE_REQUIRED_SCOPES,
  inputSchema: McpTagCreateInputSchema,
  outputSchema: McpTagSchema,
  async handler(args, context) {
    const result = await TagService.createTag(context, { name: args.name });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "TAG_NAME_ALREADY_EXISTS"
                ? `Tag "${args.name}" already exists`
                : `Failed to create tag "${args.name}"`,
          },
        ],
        isError: true,
      };
    }

    const tag = serializeMcpTag(result.data);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tag, null, 2),
        },
      ],
      structuredContent: tag,
    };
  },
});

// ── tags_delete ──

const TAGS_DELETE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const tagsDeleteTool = defineMcpTool({
  name: "tags_delete",
  description: "Delete a tag.",
  requiredScopes: TAGS_DELETE_REQUIRED_SCOPES,
  inputSchema: McpTagDeleteInputSchema,
  outputSchema: McpTagDeleteOutputSchema,
  async handler(args, context) {
    const result = await TagService.deleteTag(context, { id: args.id });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "TAG_NOT_FOUND"
                ? `Tag ${args.id} not found`
                : `Failed to delete tag ${args.id}`,
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
      content: [
        {
          type: "text",
          text: `Deleted tag ${args.id}`,
        },
      ],
      structuredContent: output,
    };
  },
});

// ── tags_update ──

const TAGS_UPDATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const tagsUpdateTool = defineMcpTool({
  name: "tags_update",
  description: "Rename an existing tag.",
  requiredScopes: TAGS_UPDATE_REQUIRED_SCOPES,
  inputSchema: McpTagUpdateInputSchema,
  outputSchema: McpTagSchema,
  async handler(args, context) {
    const result = await TagService.updateTag(context, {
      id: args.id,
      data: { name: args.name },
    });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "TAG_NOT_FOUND"
                ? `Tag ${args.id} not found`
                : result.error.reason === "TAG_NAME_ALREADY_EXISTS"
                  ? `Tag "${args.name}" already exists`
                  : `Failed to update tag ${args.id}`,
          },
        ],
        isError: true,
      };
    }

    const tag = serializeMcpTag(result.data);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tag, null, 2),
        },
      ],
      structuredContent: tag,
    };
  },
});

// ── posts_set_tags ──

const POSTS_SET_TAGS_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const postsSetTagsTool = defineMcpTool({
  name: "posts_set_tags",
  description:
    "Replace all tags on a post. Missing tags are created automatically.",
  requiredScopes: POSTS_SET_TAGS_REQUIRED_SCOPES,
  inputSchema: McpPostSetTagsInputSchema,
  outputSchema: McpPostSetTagsOutputSchema,
  async handler(args, context) {
    const post = await PostService.findPostById(context, { id: args.postId });
    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.postId} not found`,
          },
        ],
        isError: true,
      };
    }

    const tagIds = await ensureTagIdsByNames(context, args.tagNames);
    await TagService.setPostTags(context, {
      postId: args.postId,
      tagIds,
    });

    const tags = await TagService.getTagsByPostId(context, {
      postId: args.postId,
    });
    const output = {
      postId: args.postId,
      tags: tags.map(serializeMcpTag),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
      structuredContent: output,
    };
  },
});

export const mcpTagsTools: McpToolDefinition[] = [
  tagsListTool,
  tagsCreateTool,
  tagsDeleteTool,
  tagsUpdateTool,
  postsSetTagsTool,
];
