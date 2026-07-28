import type { z } from "zod";
import { queueMessageSchema } from "./queue.schema";

type QueueMessage = z.infer<typeof queueMessageSchema>;

interface QueueHandlerContext {
  env: Env;
  ctx: ExecutionContext;
}

type MessageHandler<T extends QueueMessage = QueueMessage> = (
  context: QueueHandlerContext,
  data: T["data"],
  messageId: string,
) => Promise<void>;

interface RegisteredHandler {
  // biome-ignore lint/suspicious/noExplicitAny: discriminated union — type-narrowed by key in registry
  handler: MessageHandler<any>;
  /** 为 true 时，消息会累积并批量 ack（如 PAGEVIEW 场景）。*/
  batch?: boolean;
}

const registry = new Map<string, RegisteredHandler>();

/** 注册一个 queue 消息处理器。*/
export function registerQueueHandler(
  type: QueueMessage["type"],
  handler: MessageHandler,
  opts: { batch?: boolean } = {},
) {
  registry.set(type, { handler, batch: !!opts.batch });
}

// ---------- 内联注册现有的消费者 ----------

import { handleEmailMessage } from "@/features/email/api/email.consumer";
import { handlePageviewMessages } from "@/features/pageview/api/pageview.consumer";
import { handlePostAutoSnapshotMessage } from "@/features/posts/api/post-auto-snapshot.consumer";
import { handleWebhookMessage } from "@/features/webhook/api/webhook.consumer";

registerQueueHandler(
  "EMAIL",
  // biome-ignore lint/suspicious/noExplicitAny: type-narrowed at runtime by discriminated union
  ({ env, ctx }, data: any, messageId) =>
    handleEmailMessage(
      { env, executionCtx: ctx },
      { ...data, idempotencyKey: messageId },
    ),
);

registerQueueHandler(
  "WEBHOOK",
  // biome-ignore lint/suspicious/noExplicitAny: type-narrowed at runtime by discriminated union
  ({ env }, data: any, messageId) =>
    handleWebhookMessage({ env }, data, messageId),
);

registerQueueHandler(
  "POST_AUTO_SNAPSHOT",
  // biome-ignore lint/suspicious/noExplicitAny: type-narrowed at runtime by discriminated union
  ({ env }, data: any) => handlePostAutoSnapshotMessage({ env }, data),
);

registerQueueHandler(
  "PAGEVIEW",
  // ponytail: batch handling lives in handleQueueBatch; PAGEVIEW handlers are a no-op here
  () => Promise.resolve(),
  { batch: true },
);

// ---------- 批量调度 ----------

interface BatchedItem {
  data: { postId: number; visitorHash: string };
  message: Message;
}

export async function handleQueueBatch(
  batch: MessageBatch,
  env: Env,
  ctx: ExecutionContext,
) {
  const pageviewBatch: BatchedItem[] = [];

  for (const message of batch.messages) {
    const parsed = queueMessageSchema.safeParse(message.body);
    if (!parsed.success) {
      console.error(
        JSON.stringify({
          message: "queue invalid message",
          body: message.body,
          error: parsed.error.message,
        }),
      );
      message.ack();
      continue;
    }

    const event = parsed.data;
    const reg = registry.get(event.type);

    if (!reg) {
      console.error(
        JSON.stringify({
          message: "queue unknown message type",
          type: event.type,
        }),
      );
      message.ack();
      continue;
    }

    try {
      if (reg.batch) {
        pageviewBatch.push({
          data: event.data as BatchedItem["data"],
          message,
        });
        continue;
      }

      await reg.handler({ env, ctx }, event.data, message.id);
      message.ack();
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "queue processing failed",
          attempt: message.attempts,
          error: error instanceof Error ? error.message : "unknown error",
        }),
      );
      message.retry();
    }
  }

  if (pageviewBatch.length > 0) {
    try {
      await handlePageviewMessages(
        { env },
        pageviewBatch.map((item) => item.data),
      );
      for (const item of pageviewBatch) item.message.ack();
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "pageview batch processing failed",
          count: pageviewBatch.length,
          error: error instanceof Error ? error.message : "unknown error",
        }),
      );
      for (const item of pageviewBatch) item.message.retry();
    }
  }
}
