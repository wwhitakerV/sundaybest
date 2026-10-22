import { cancelAllLocalReminders } from "../notifications/local-reminders";
import { createExpoSecureStorage } from "../security/secure-storage/expo-secure-storage";
import { forgetReaderIdentity } from "../security/session/forget-identity";
import { wipeDeviceData } from "../storage/device-wipe";
import { addDevMenuItem, reloadApp } from "./dev-menu";

/**
 * Starts SundayBest over as a reader it has never met (ADR 0035): forgets
 * who this install is, empties the phone of what the last reader left, cancels
 * their reminders, and reloads into the launch. Who it was goes first, so any
 * cache write still racing in is kept for a user no longer here. The server
 * keeps the old reader, unreached.
 */
async function startOver(): Promise<void> {
  await forgetReaderIdentity(createExpoSecureStorage());
  await wipeDeviceData();
  await cancelAllLocalReminders();
  reloadApp("Start over as a new reader");
}

/** Puts "Start over as a new reader" in the developer menu — development builds only. */
export function registerStartOver(): void {
  addDevMenuItem("Start over as a new reader", () => void startOver());
}
