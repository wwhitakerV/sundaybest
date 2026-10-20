/** The time as the status bar shows it: its hour and minutes apart, and how it's read aloud. */
export type StatusBarTime = { hours: string; minutes: string; spoken: string };

/** How the battery is drawn — its percentage, red when low — and read aloud. */
export type StatusBarBattery = {
  level: number;
  tone: "ink" | "low";
  italic: boolean;
  endCap: "dot" | "bolt";
  spoken: string;
};

/** Where the bar's time and battery sit (`layOutStatusBar`). */
export type StatusBarPlacement = {
  height: number;
  centerY: number;
  timeX: number;
  batteryX: number;
  /** A home-button iPhone's: the time and battery at the bar's edges, not in ears. */
  edged: boolean;
};
