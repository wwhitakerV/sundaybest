/** Types owned by this slice. Anything another slice needs must be re-exported from `index.ts`. */
export type Plan = {
  id: string;
  title: string;
  /** 1 through 7. Never assume every plan has the same length. */
  totalDays: number;
  /** The day the user is currently on, 1-indexed. */
  currentDay: number;
  /** 1-indexed day numbers the user has finished. */
  completedDays: number[];
  completed: boolean;
};
