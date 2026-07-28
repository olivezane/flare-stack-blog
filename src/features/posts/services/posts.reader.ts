import { z } from "zod";
import * as CacheService from "@/features/cache/cache.service";
import * as PostRepo from "@/features/posts/data/posts.data";
import type {
  FindPostBySlugInput,
  FindRelatedPostsInput,
  GetPostsCursorInput,
} from "@/features/posts/schema/posts.schema";
import {
  normalizePostTagName,
  POSTS_CACHE_KEYS,
  PostItemSchema,
  PostListResponseSchema,
  PostWithTocSchema,
} from "@/features/posts/schema/posts.schema";
import { highlightCodeBlocks } from "@/features/posts/utils/content";
import { generateTableOfContents } from "@/features/posts/utils/toc";

function stripPublicContentJson<T extends { publicContentJson?: unknown }>(
  post: T,
): Omit<T, "publicContentJson"> {
  const { publicContentJson: _publicContentJson, ...rest } = post;
  return rest;
}

export async function getPinnedPosts(
  context: DbContext & { executionCtx: ExecutionContext },
) {
  return CacheService.getVersioned(
    context,
    "posts:list",
    POSTS_CACHE_KEYS.pinned,
    PostItemSchema.array(),
    () => PostRepo.findPinnedPosts(context.db),
    { ttl: "7d" },
  );
}

export async function getPostsCursor(
  context: DbContext & { executionCtx: ExecutionContext },
  data: GetPostsCursorInput,
) {
  const tagName = normalizePostTagName(data.tagName);
  const fetcher = async () =>
    await PostRepo.getPostsCursor(context.db, {
      cursor: data.cursor,
      limit: data.limit,
      publicOnly: true,
      tagName,
      excludePinned: data.excludePinned,
    });

  return await CacheService.getVersioned(
    context,
    "posts:list",
    (version) =>
      POSTS_CACHE_KEYS.list(
        version,
        data.limit ?? 10,
        data.cursor ?? 0,
        tagName,
      ),
    PostListResponseSchema,
    fetcher,
    {
      ttl: "7d",
    },
  );
}

export async function findPostBySlug(
  context: DbContext & { executionCtx: ExecutionContext },
  data: FindPostBySlugInput,
) {
  const fetcher = async () => {
    const post = await PostRepo.findPostBySlug(context.db, data.slug, {
      publicOnly: true,
    });
    if (!post) return null;

    let contentJson = post.publicContentJson ?? post.contentJson;
    // Backward-compatible fallback for posts that haven't been reprocessed yet.
    // New publishes should read pre-highlighted content from `publicContentJson`.
    if (!post.publicContentJson && contentJson) {
      contentJson = await highlightCodeBlocks(contentJson);
      context.executionCtx.waitUntil(
        PostRepo.updatePublicContentSnapshot(
          context.db,
          post.id,
          contentJson,
        ).then(() => undefined),
      );
    }

    return {
      ...stripPublicContentJson(post),
      contentJson,
      toc: generateTableOfContents(contentJson),
    };
  };

  return await CacheService.getVersioned(
    context,
    "posts:detail",
    (version) => POSTS_CACHE_KEYS.detail(version, data.slug),
    PostWithTocSchema,
    fetcher,
    { ttl: "7d" },
  );
}

export async function getRelatedPosts(
  context: DbContext & { executionCtx: ExecutionContext },
  data: FindRelatedPostsInput,
) {
  const fetcher = async () => {
    const postIds = await PostRepo.getRelatedPostIds(context.db, data.slug, {
      limit: data.limit,
    });
    return postIds;
  };

  // Cache IDs for 7 days (long-lived cache)
  // This key is NOT dependent on version, so it persists across publishes
  const cacheKey = POSTS_CACHE_KEYS.related(data.slug, data.limit);
  const cachedIds = await CacheService.get(
    context,
    cacheKey,
    z.array(z.number()),
    fetcher,
    {
      ttl: "7d",
    },
  );

  if (cachedIds.length === 0) {
    return [];
  }

  // Real-time hydration: fetch actual post data (automatically filters non-published)
  const posts = await PostRepo.getPublicPostsByIds(context.db, cachedIds);

  // Restore order because SQL 'IN' clause doesn't guarantee order
  const orderedPosts = cachedIds
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return orderedPosts;
}
