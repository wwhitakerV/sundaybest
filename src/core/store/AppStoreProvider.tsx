import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

import type { IsoDate } from "@/types/domain";

import type { AppAction } from "./actions";
import { appReducer } from "./reducer";
import { getToday } from "./clock";
import { INITIAL_STATE, type AppState } from "./state";

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch<AppAction> | null>(null);

type AppStoreProviderProps = {
  children: ReactNode;
  /** Where the store starts — the app's data by default; tests pass their own. */
  initialState?: AppState;
};

/**
 * Holds the app's state — the single source of truth for everything the app
 * knows — and hands it down. Read it with `useAppSelector`, change it with
 * `useStoreActions`. Components never learn where the data came from.
 */
export function AppStoreProvider({
  children,
  initialState = INITIAL_STATE,
}: AppStoreProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}

function useStoreState(): AppState {
  const state = useContext(StateContext);
  if (!state) throw new Error("The app store is read inside AppStoreProvider only.");
  return state;
}

/**
 * Reads from the store: `useAppSelector((state) => getPlanById(state, id))`.
 * Re-renders whenever the store changes.
 */
export function useAppSelector<T>(selector: (state: AppState) => T): T {
  return selector(useStoreState());
}

/** The store's raw dispatch — for `useStoreActions` only; components use that. */
export function useAppDispatch(): Dispatch<AppAction> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("The app store is changed inside AppStoreProvider only.");
  return dispatch;
}

/** "Today", as the store's data sees it — for selectors that take a date. */
export function useToday(): IsoDate {
  useStoreState();
  return getToday();
}
