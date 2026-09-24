/**
 * The building blocks every entity shares. Plain, serialisable values only —
 * everything here can be stored or sent as JSON as-is.
 */

/** An entity's ID. Every entity is identified by a string. */
export type Id = string;

/** A moment in time, ISO 8601 in UTC: `"2026-09-23T14:05:00.000Z"`. */
export type IsoDateTime = string;

/** A calendar day, ISO 8601: `"2026-09-23"`. For things that happen on a day, not at an instant. */
export type IsoDate = string;

/** A wall-clock time, 24-hour `HH:mm`, in the user's own time zone: `"06:30"`. */
export type LocalTime = string;

/** When a record was first created and last changed. */
export type Timestamps = {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

/** Anything that can change: an ID plus its timestamps. */
export type Entity = { id: Id } & Timestamps;

/** A day of the week, Sunday first — the app's week starts on Sunday. */
export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
