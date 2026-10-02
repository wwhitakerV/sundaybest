import type { AppAction } from "../actions";
import type { AppState } from "../state";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

/** The local/profile name the user chose. Blank input is normalised to null. */
export function updateDisplayName(state: AppState, action: Action<"user/displayName">): AppState {
  const next = action.displayName?.trim() || null;
  if (state.user.displayName === next) return state;
  return { ...state, user: { ...state.user, displayName: next, updatedAt: action.at } };
}

/** Welcome is completed once; the server will own the canonical timestamp when real data is wired. */
export function completeOnboarding(
  state: AppState,
  action: Action<"user/completeOnboarding">,
): AppState {
  if (state.user.onboardedAt !== null) return state;
  return {
    ...state,
    user: { ...state.user, onboardedAt: action.at, updatedAt: action.at },
  };
}
