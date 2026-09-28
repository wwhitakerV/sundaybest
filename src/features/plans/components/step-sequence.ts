/**
 * The geometry Plan Detail's day shares between its step rows
 * (`StudyStepRow`), their marks (`StudyStepNode`), and the Quick Check that
 * follows them (`QuickCheckFollowUp`) — so all three line up on one column.
 */

/** A step's mark — and the width of the column the day's sequence runs down. */
export const STEP_NODE_SIZE = 36;
/** Round a row's contents: the soft surface under the step you're on reaches this far past its mark. */
export const STEP_ROW_INSET = 12;
/** Between the mark's column and the words. */
export const STEP_MARK_GAP = 16;
/** A tick, drawn a touch firmer than the icons. */
export const STEP_CHECK_STROKE = 2.5;
