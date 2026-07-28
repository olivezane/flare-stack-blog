import * as CacheService from "@/features/cache/cache.service";
import { POSTS_CACHE_KEYS } from "@/features/posts/schema/posts.schema";
import { TAGS_CACHE_KEYS } from "@/features/tags/tags.schema";
import { purgeCDNCache, purgePostCDNCache } from "@/lib/invalidate";

/**
 * 缓存失效协调器 —— 控制 KV 版本提升、键删除和 CDN 清理的单点入口。
 *
 * 所有发布/取消发布/标签变更/站点级缓存清除操作都路由到这里，
 * 以确保失效操作在所有调用站点之间保持一致。
 */

/** 在发布或取消发布后，使单个 Post 的缓存失效。 */
export async function invalidatePost(
  context: { env: Env },
  slug: string,
): Promise<void> {
  const version = await CacheService.getVersion(context, "posts:detail");
  await Promise.all([
    CacheService.deleteKey(context, POSTS_CACHE_KEYS.detail(version, slug)),
    CacheService.deleteKey(context, TAGS_CACHE_KEYS.publicList),
    purgePostCDNCache(context.env, slug),
    CacheService.bumpVersion(context, "posts:list"),
  ]);
}

/**
 * 使 Post 的同步哈希失效（在 Post 被删除后进行清理）。
 * 与 `invalidatePost` 分开，因为工作流会自行重新计算哈希。
 */
export async function invalidateSyncHash(
  context: { env: Env },
  postId: number,
): Promise<void> {
  await CacheService.deleteKey(context, POSTS_CACHE_KEYS.syncHash(postId));
}

/**
 * 使受标签变更影响的缓存失效（创建/更新/删除）。
 *
 * 策略：
 *   - 始终清除标签的公共列表（标签云会随着每次标签变更而改变）
 *   - 如果已知受影响的 Post：逐个精确地使它们失效
 *   - 如果未知受影响的 Post（空的 / DB 滞后）：回退到提升所有版本
 */
export async function invalidateTagRelated(
  context: { env: Env },
  affectedPosts: Array<{ id: number; slug: string }>,
): Promise<void> {
  // 1. 始终清除公共标签列表
  await CacheService.deleteKey(context, TAGS_CACHE_KEYS.publicList);

  if (affectedPosts.length > 0) {
    // 2. 精确地使受影响的 Post 失效
    const tasks: Array<Promise<void>> = [];

    tasks.push(CacheService.bumpVersion(context, "posts:list"));

    const detailVersion = await CacheService.getVersion(
      context,
      "posts:detail",
    );
    for (const post of affectedPosts) {
      tasks.push(
        CacheService.deleteKey(
          context,
          POSTS_CACHE_KEYS.detail(detailVersion, post.slug),
        ),
      );
    }

    // 清除 Post 页面和列表页面的 CDN
    const cdnUrls = ["/", "/posts", "/api/tags"];
    for (const post of affectedPosts) {
      cdnUrls.push(`/post/${post.slug}`);
    }
    tasks.push(purgeCDNCache(context.env, { urls: cdnUrls }));

    await Promise.all(tasks);
  } else {
    // 3. 保守策略：可能是 DB/KV 不同步，提升所有版本
    await Promise.all([
      CacheService.bumpVersion(context, "posts:detail"),
      CacheService.bumpVersion(context, "posts:list"),
      purgeCDNCache(context.env, { urls: ["/", "/posts", "/api/tags"] }),
    ]);
  }
}

/** 使所有公共缓存失效（管理员手动操作）。 */
export async function invalidateSite(context: {
  env: Env;
}): Promise<{ success: boolean }> {
  const cdnTask = purgeCDNCache(context.env, { prefixes: ["/"] });
  const kvTasks = [
    CacheService.bumpVersion(context, "posts:list"),
    CacheService.bumpVersion(context, "posts:detail"),
    CacheService.deleteKey(context, TAGS_CACHE_KEYS.publicList),
  ];

  await Promise.all([cdnTask, ...kvTasks]);
  return { success: true };
}

/** 使友链缓存失效（创建/审核/更新/删除后调用）。*/
export async function invalidateFriendLinks(context: {
  env: Env;
}): Promise<void> {
  await Promise.all([
    CacheService.bumpVersion(context, "friend-links:list"),
    purgeCDNCache(context.env, { urls: ["/friend-links"] }),
  ]);
}
