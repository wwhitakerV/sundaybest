/** The Dynamic Island's width, about: the ears are what's left either side. */
const ISLAND_WIDTH = 126;

/** A notch's width since the iPhone 12 (earlier ones are wider, and still clear the time). */
const NOTCH_WIDTH = 162;

/** From this top inset up, the phone has a Dynamic Island; below it, a notch. */
const ISLAND_INSET = 51;

/** A notch's least top inset; below it, the phone has a home button. */
const NOTCH_INSET = 44;

/** Set by eye on the phone: how far further out than their ears' middles the time and the battery sit. */
const TIME_SPREAD = 18;
const BATTERY_SPREAD = 20.5;

/** A home-button iPhone's bar: iOS's 20pt, the time and battery at its edges. */
const HOME_BUTTON_BAR = 20;

/**
 * Where the status bar's time and battery sit: in the ears either side of the
 * island or notch, a little out from their middles, on the middle of the bar; on a home-button iPhone,
 * at its edges (`edged`) on iOS's 20pt bar — kept even when hiding the system
 * bar leaves no inset at all.
 */
export function layOutStatusBar(windowWidth: number, insetTop: number) {
  if (insetTop < NOTCH_INSET) {
    const height = HOME_BUTTON_BAR;
    return { height, centerY: height / 2, timeX: 0, batteryX: windowWidth, edged: true };
  }
  const cutout = insetTop >= ISLAND_INSET ? ISLAND_WIDTH : NOTCH_WIDTH;
  const ear = (windowWidth - cutout) / 2;
  return {
    height: insetTop,
    centerY: insetTop / 2,
    timeX: ear / 2 - TIME_SPREAD,
    batteryX: windowWidth - ear / 2 + BATTERY_SPREAD,
    edged: false,
  };
}
