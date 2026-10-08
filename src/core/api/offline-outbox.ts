import { z } from "zod";
import type { QueryClient } from "@tanstack/react-query";

import type { SundayBestApi } from "./ApiProvider";
import { isApiError } from "./api-error";
import { apiQueryKeys } from "./query-keys";
import {
  reminderKindSchema,
  updateReminderRequestSchema,
  updateSettingsRequestSchema,
} from "./contracts";
import {
  listPendingMutations,
  recordMutationFailure,
  removePendingMutation,
  type OutboxMutation,
} from "@/core/storage/mutation-outbox";

const stepPayloadSchema = z.object({
  planId: z.string().min(1),
  dayNumber: z.number().int().min(1).max(7),
  step: z.enum(["read", "scripture", "reflect", "pray"]),
});

const dayPayloadSchema = z.object({
  planId: z.string().min(1),
  dayNumber: z.number().int().min(1).max(7),
});

const savedPayloadSchema = z.object({
  planId: z.string().min(1),
  saved: z.boolean(),
});

const planPayloadSchema = z.object({ planId: z.string().min(1) });

const settingsPayloadSchema = z.object({
  input: updateSettingsRequestSchema,
});

const reminderPayloadSchema = z.object({
  kind: reminderKindSchema,
  input: updateReminderRequestSchema,
});

export interface OutboxFlushResult {
  attempted: number;
  completed: number;
  stoppedOffline: boolean;
}

/** Replays queued mutations in creation order, preserving their idempotency keys. */
export async function flushMutationOutbox(
  api: SundayBestApi,
  queryClient: QueryClient,
): Promise<OutboxFlushResult> {
  const pending = await listPendingMutations();
  let attempted = 0;
  let completed = 0;

  for (const item of pending) {
    attempted += 1;
    try {
      await replay(api, item);
      await removePendingMutation(item.id);
      completed += 1;
    } catch (cause) {
      const code = isApiError(cause) ? cause.code : "INTERNAL";
      await recordMutationFailure(item.id, code);

      // Transport/server failure means later items cannot be trusted to reach
      // the API either. Keep this item and every item after it in order.
      if (
        !isApiError(cause) ||
        cause.retryable ||
        cause.kind === "network" ||
        cause.kind === "timeout"
      ) {
        return { attempted, completed, stoppedOffline: true };
      }

      // A permanent conflict/validation response means the server is canonical.
      // Drop the unreplayable item and continue; the invalidation below will
      // reconcile the optimistic local state on the next successful read.
      await removePendingMutation(item.id);
    }
  }

  if (attempted > 0) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans }),
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot }),
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.planRoot }),
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.settings }),
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.reminders }),
    ]);
  }

  return { attempted, completed, stoppedOffline: false };
}

async function replay(api: SundayBestApi, item: OutboxMutation): Promise<void> {
  switch (item.kind) {
    case "study.completeStep": {
      const payload = stepPayloadSchema.parse(item.payload);
      await api.study.completeStep(
        payload.planId,
        payload.dayNumber,
        payload.step,
        item.idempotencyKey,
      );
      return;
    }
    case "study.completeDay": {
      const payload = dayPayloadSchema.parse(item.payload);
      await api.study.completeDay(payload.planId, payload.dayNumber, item.idempotencyKey);
      return;
    }
    case "plan.setSaved": {
      const payload = savedPayloadSchema.parse(item.payload);
      if (payload.saved) await api.plans.save(payload.planId, item.idempotencyKey);
      else await api.plans.removeSaved(payload.planId, item.idempotencyKey);
      return;
    }
    case "plan.archive": {
      const payload = planPayloadSchema.parse(item.payload);
      await api.plans.archive(payload.planId, item.idempotencyKey);
      return;
    }
    case "settings.update": {
      const payload = settingsPayloadSchema.parse(item.payload);
      await api.settings.update(payload.input, item.idempotencyKey);
      return;
    }
    case "reminder.update": {
      const payload = reminderPayloadSchema.parse(item.payload);
      await api.reminders.update(payload.kind, payload.input, item.idempotencyKey);
      return;
    }
  }
}
