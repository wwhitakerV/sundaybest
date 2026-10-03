import { and, asc, eq, lt } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { planDayProgress, planDays, plans, userPlanEnrollments } from "../db/schema.js";
import { localDateInTimeZone } from "../domain/time.js";
import { AppError } from "../http/errors.js";

export interface StudyAccess {
  plan: typeof plans.$inferSelect;
  day: typeof planDays.$inferSelect;
  enrollment: typeof userPlanEnrollments.$inferSelect;
  progress: typeof planDayProgress.$inferSelect;
  localDate: string;
}

export async function requireStudyAccess(input: {
  db: Database;
  userId: string;
  planId: string;
  dayNumber: number;
  timezone: string;
}): Promise<StudyAccess> {
  const rows = await input.db
    .select({ plan: plans, day: planDays, enrollment: userPlanEnrollments, progress: planDayProgress })
    .from(plans)
    .innerJoin(planDays, and(eq(planDays.planId, plans.id), eq(planDays.dayNumber, input.dayNumber)))
    .innerJoin(
      userPlanEnrollments,
      and(eq(userPlanEnrollments.planId, plans.id), eq(userPlanEnrollments.userId, input.userId)),
    )
    .innerJoin(
      planDayProgress,
      and(eq(planDayProgress.enrollmentId, userPlanEnrollments.id), eq(planDayProgress.planDayId, planDays.id)),
    )
    .where(eq(plans.id, input.planId))
    .limit(1);
  const row = rows[0];
  if (!row) throw new AppError("NOT_FOUND", "Study day not found");
  if (!row.plan.readyAt) throw new AppError("PLAN_NOT_READY", "Plan is still being generated");
  if (row.enrollment.status !== "active" && row.enrollment.status !== "completed") {
    throw new AppError("DAY_LOCKED", "Start the plan before studying this day");
  }

  const localDate = localDateInTimeZone(new Date(), input.timezone);
  if (row.progress.scheduledOn > localDate) throw new AppError("DAY_LOCKED", "This study day is scheduled for a future date");

  const previous = await input.db
    .select({ completedAt: planDayProgress.completedAt })
    .from(planDays)
    .innerJoin(
      planDayProgress,
      and(eq(planDayProgress.planDayId, planDays.id), eq(planDayProgress.enrollmentId, row.enrollment.id)),
    )
    .where(and(eq(planDays.planId, input.planId), lt(planDays.dayNumber, input.dayNumber)))
    .orderBy(asc(planDays.dayNumber));
  if (previous.some((item) => item.completedAt === null)) {
    throw new AppError("DAY_LOCKED", "Complete earlier study days first");
  }
  return { ...row, localDate };
}
