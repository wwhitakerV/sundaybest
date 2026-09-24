import type { AppData, IsoDate } from "@/types/domain";

import { MOCK_DATA, MOCK_TODAY } from "@/core/mock-data";

/**
 * The store's state: everything the app knows, as normalized tables (see
 * `AppData`). It holds facts only — anything that can be worked out from
 * them is a selector, never a stored value.
 */
export type AppState = AppData;

/** Where the store starts. The mock data stands in until the local database does. */
export const INITIAL_STATE: AppState = MOCK_DATA;

/** "Today", as the store's data sees it — fixed while the data is mock data. */
export const STORE_TODAY: IsoDate = MOCK_TODAY;
