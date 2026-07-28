import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as PostService from "@/features/posts/services/posts.service";
import { toLocalDateString } from "@/lib/utils";
import type { McpToolDefinition } from "../../service/mcp-tool";
import { defineMcpTool } from "../../service/mcp-tool";
import {
  McpPostByIdInputSchema,
  McpPostCreateDraftOutputSchema,
  McpPostDeleteOutputSchema,
  McpPostDetailSchema,
  McpPostSetVisibilityInputSchema,
  McpPostSetVisibilityOutputSchema,
  McpPostsListInputSchema,
  McpPostsListOutputSchema,
  McpPostUpdateInputSchema,
} from "./schema/mcp-posts.schema";
import {
  serializeMcpPostDetail,
  serializeMcpPostListItem,
  toPostUpdateInput,
} from "./service/mcp-posts.service";

// ── posts_list ──

const POSTS_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["read"],
};

const postsListTool = defineMcpTool({
  name: "posts_list",
  description:
    "List blog posts with optional filters for admin-style management.",
  requiredScopes: POSTS_LIST_REQUIRED_SCOPES,
  inputSchema: McpPostsListInputSchema,
  outputSchema: McpPostsListOutputSchema,
  async handler(args, context) {
    const items = (await PostService.getPosts(context, args)).map(
      serializeMcpPostListItem,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ items }, null, 2),
        },
      ],
      structuredContent: {
        items,
      },
    };
  },
});

// ── posts_get ──

const POSTS_GET_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["read"],
};

const postsGetTool = defineMcpTool({
  name: "posts_get",
  description:
    "Get a single blog post by numeric ID, including markdown body, tags, and sync metadata.",
  requiredScopes: POSTS_GET_REQUIRED_SCOPES,
  inputSchema: McpPostByIdInputSchema,
  outputSchema: McpPostDetailSchema,
  async handler(args, context) {
    const post = await PostService.findPostById(context, args);

    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    const serializedPost = serializeMcpPostDetail(post);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(serializedPost, null, 2),
        },
      ],
      structuredContent: serializedPost,
    };
  },
});

// ── posts_create_draft ──

const POSTS_CREATE_DRAFT_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const postsCreateDraftTool = defineMcpTool({
  name: "posts_create_draft",
  description: "Create a new empty draft post and return its numeric ID.",
  requiredScopes: POSTS_CREATE_DRAFT_REQUIRED_SCOPES,
  outputSchema: McpPostCreateDraftOutputSchema,
  async handler(context) {
    const draft = await PostService.createEmptyPost(context);

    return {
      content: [
        {
          type: "text",
          text: `Created draft post ${draft.id}`,
        },
      ],
      structuredContent: draft,
    };
  },
});

// ── posts_delete ──

const POSTS_DELETE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const postsDeleteTool = defineMcpTool({
  name: "posts_delete",
  description:
    "Delete a post permanently. Use with care because this removes the post from the CMS.",
  requiredScopes: POSTS_DELETE_REQUIRED_SCOPES,
  inputSchema: McpPostByIdInputSchema,
  outputSchema: McpPostDeleteOutputSchema,
  async handler(args, context) {
    const post = await PostService.findPostById(context, { id: args.id });
    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    const deleteResult = await PostService.deletePost(context, { id: args.id });
    if (deleteResult.error) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} could not be deleted`,
          },
        ],
        isError: true,
      };
    }

    const result = {
      deleted: true as const,
      id: post.id,
      slug: post.slug,
      status: post.status,
      title: post.title,
    };

    return {
      content: [
        {
          type: "text",
          text: `Deleted post ${post.id} (${post.slug})`,
        },
      ],
      structuredContent: result,
    };
  },
});

// ── posts_update ──

const POSTS_UPDATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const postsUpdateTool = defineMcpTool({
  name: "posts_update",
  description:
    "Update a blog post. Use markdown for the body. Typical flow is create a draft first, then update it.",
  requiredScopes: POSTS_UPDATE_REQUIRED_SCOPES,
  inputSchema: McpPostUpdateInputSchema,
  outputSchema: McpPostDetailSchema,
  async handler(args, context) {
    const updateInput = await toPostUpdateInput(args);
    const result = await PostService.updatePost(context, updateInput);

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    const post = await PostService.findPostById(context, {
      id: result.data.id,
    });
    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} was updated but could not be reloaded`,
          },
        ],
        isError: true,
      };
    }

    const serializedPost = serializeMcpPostDetail(post);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(serializedPost, null, 2),
        },
      ],
      structuredContent: serializedPost,
    };
  },
});

// ── posts_set_visibility ──

const POSTS_SET_VISIBILITY_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const postsSetVisibilityTool = defineMcpTool({
  name: "posts_set_visibility",
  description:
    "Publish or unpublish a post. This queues the publish workflow, not just a raw field update.",
  requiredScopes: POSTS_SET_VISIBILITY_REQUIRED_SCOPES,
  inputSchema: McpPostSetVisibilityInputSchema,
  outputSchema: McpPostSetVisibilityOutputSchema,
  async handler(args, context) {
    const updateResult = await PostService.updatePost(context, {
      id: args.id,
      data: {
        status: args.visibility,
        ...(args.publishedAt !== undefined
          ? {
              publishedAt: args.publishedAt ? new Date(args.publishedAt) : null,
            }
          : {}),
      },
    });

    if (updateResult.error) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    await PostService.startPostProcessWorkflow(context, {
      id: args.id,
      status: args.visibility,
      clientToday: args.clientToday ?? toLocalDateString(new Date()),
    });

    const post = await PostService.findPostById(context, { id: args.id });
    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} visibility was queued but could not be reloaded`,
          },
        ],
        isError: true,
      };
    }

    const operation = args.visibility === "published" ? "publish" : "unpublish";

    const result = {
      id: post.id,
      operation,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      status: post.status,
      workflowQueued: true as const,
    };

    return {
      content: [
        {
          type: "text",
          text:
            operation === "publish"
              ? `Queued publish workflow for post ${post.id}`
              : `Queued unpublish workflow for post ${post.id}`,
        },
      ],
      structuredContent: result,
    };
  },
});

export const mcpPostsTools: McpToolDefinition[] = [
  postsListTool,
  postsGetTool,
  postsCreateDraftTool,
  postsDeleteTool,
  postsUpdateTool,
  postsSetVisibilityTool,
];
