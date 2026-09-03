/**
 * The numbers that describe signature geometry, in one place.
 *
 * These were previously literals repeated across five files, and two of them
 * disagreed: SignatureLayout defaulted baselineY to 136 against a 200px canvas
 * (0.68) while SignatureRenderer placed typed ink at canvasHeight * 0.7. For a
 * typed signature with no stored penStyle, the guideline was drawn at 68% and
 * the ink sat at 70% — a 4px mismatch that the unexplained -8 in the layout's
 * name offset was partly cancelling out.
 */

/** Height of the capture canvas a signature's baselineY is measured against. */
export const DEFAULT_CANVAS_HEIGHT = 200;

/**
 * Where the writing line sits within the canvas, as a fraction of its height.
 * Weighted below centre so ascenders have room without leaving the lower half
 * of the canvas empty. Single source of truth: both the guideline in
 * SignatureLayout and the typed ink in SignatureRenderer derive from this.
 */
export const BASELINE_FACTOR = 0.7;

/** Fallback baseline for a signature stored without its own penStyle. */
export const DEFAULT_BASELINE_Y = DEFAULT_CANVAS_HEIGHT * BASELINE_FACTOR;

/**
 * Distance from the bottom of the capture surface to the writing line, per
 * device. Desktop and mobile capture on different geometry, which is why a
 * signature drawn on a phone and one drawn on a laptop do not share a
 * baseline — that divergence is deliberate but was previously invisible,
 * living as a bare `- 64` and `- 48` in two unrelated files.
 */
export const BASELINE_INSET_DESKTOP = 64;
export const BASELINE_INSET_MOBILE = 48;

/** The signature box in an entry's closure block. */
export const SIG_BOX = { w: 256, h: 96 } as const;

/** The larger box used by the Folio hero and the Biography identity card. */
export const SIG_BOX_LARGE = { w: 288, h: 112 } as const;

/**
 * Optical nudge applied when pulling the author's name up to the signature's
 * baseline. Without it the name sits a touch low against the ink; it is a
 * seen-by-eye correction, not a derived value, which is exactly why it should
 * be named rather than left as a bare number in an inline style.
 */
export const NAME_OPTICAL_NUDGE = 8;

/**
 * How far to pull the author's name block up so it meets the signature's
 * baseline instead of clearing the whole box.
 *
 * The box is a fixed height, but the ink inside it sits wherever that
 * particular signature's baseline falls, so the gap underneath varies per
 * signature. This returns the negative offset that closes it.
 */
export function signatureNameOffset(
  baselineY: number,
  canvasHeight: number,
  boxHeight: number = SIG_BOX.h
): number {
  const inkBaselineWithinBox = boxHeight * (baselineY / canvasHeight);
  return -(boxHeight - inkBaselineWithinBox - NAME_OPTICAL_NUDGE);
}
