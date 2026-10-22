import { motion } from "@/theme";

const { welcome } = motion;

/** From the welcome's button turn: when the pill's words punch in — a breath after the pill's settled. */
export const PUNCH_AT = welcome.buttonDelayMs + welcome.cascadeMs + welcome.punchDelayMs;

/** From the welcome's button turn: when the link under it starts fading in — once the words have landed. */
export const OFFER_AT = PUNCH_AT + welcome.punchSettleMs + welcome.offerDelayMs;

/** From the welcome's button turn: when it's all in place. */
export const BUTTON_TURN_MS = OFFER_AT + welcome.offerFadeMs;
