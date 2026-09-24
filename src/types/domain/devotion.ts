import type { Entity, Id, IsoDateTime } from "./common";

/**
 * A reflection question for a day — "What are you still trying to pay
 * for?" — and the user's private answer to it, once written.
 */
export type Reflection = Entity & {
  planDayId: Id;
  /** Its place among the day's questions, from 1 ("Question 1 of 2"). */
  order: number;
  question: string;
  /** Only ever stored on the device; null until answered. */
  answer: string | null;
  answeredAt: IsoDateTime | null;
};

/** A day's prayer — its Pray step. */
export type Prayer = Entity & {
  planDayId: Id;
  title: string;
  text: string;
  /** When the user marked it prayed; null until then. */
  prayedAt: IsoDateTime | null;
};
