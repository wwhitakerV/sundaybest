/**
 * The only file other layers may import from: this entity's public contract.
 * Deep imports such as `@/entities/tabs/logic/thing` are blocked by lint.
 */
export { toAppTab } from "./logic/app-tab";
export { tabPageHref, tabPlanHref, tabPrivacyTopicHref, type TabPage } from "./routes";
