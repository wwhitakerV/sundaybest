import type { ApiClient } from "./client";
import {
  archivePlanResponseSchema,
  createPlanRequestSchema,
  createPlanResponseSchema,
  getPlanResponseSchema,
  listPlansResponseSchema,
  removeSavedPlanResponseSchema,
  resetPlanResponseSchema,
  savePlanResponseSchema,
  startPlanResponseSchema,
  type CreatePlanRequest,
} from "./contracts";

/** The plans part of the REST API (`createSundayBestApi`'s `plans`): listing, building, starting, resetting, archiving, saving. */
export function createPlansApi(client: ApiClient) {
  return {
    list: () => client.request({ path: "/v1/plans", schema: listPlansResponseSchema }),
    get: (planId: string) =>
      client.request({
        path: `/v1/plans/${encodeURIComponent(planId)}`,
        schema: getPlanResponseSchema,
      }),
    create: (input: CreatePlanRequest, idempotencyKey: string) =>
      client.request({
        path: "/v1/plans",
        method: "POST",
        body: createPlanRequestSchema.parse(input),
        schema: createPlanResponseSchema,
        idempotencyKey,
        idempotent: true,
      }),
    start: (planId: string, idempotencyKey: string) =>
      client.request({
        path: `/v1/plans/${encodeURIComponent(planId)}/start`,
        method: "POST",
        schema: startPlanResponseSchema,
        idempotencyKey,
        idempotent: true,
      }),
    reset: (planId: string, idempotencyKey: string) =>
      client.request({
        path: `/v1/plans/${encodeURIComponent(planId)}/reset`,
        method: "POST",
        schema: resetPlanResponseSchema,
        idempotencyKey,
        idempotent: true,
      }),
    archive: (planId: string, idempotencyKey: string) =>
      client.request({
        path: `/v1/plans/${encodeURIComponent(planId)}/archive`,
        method: "POST",
        schema: archivePlanResponseSchema,
        idempotencyKey,
        idempotent: true,
      }),
    save: (planId: string, idempotencyKey: string) =>
      client.request({
        path: `/v1/plans/${encodeURIComponent(planId)}/saved`,
        method: "PUT",
        schema: savePlanResponseSchema,
        idempotencyKey,
        idempotent: true,
      }),
    removeSaved: (planId: string, idempotencyKey: string) =>
      client.request({
        path: `/v1/plans/${encodeURIComponent(planId)}/saved`,
        method: "DELETE",
        schema: removeSavedPlanResponseSchema,
        idempotencyKey,
        idempotent: true,
      }),
  };
}
