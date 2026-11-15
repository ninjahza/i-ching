# User Cast UI Contract

## Method and availability

- The question screen offers Three coins, Yarrow stalks and User cast. Coins
  remains the default unless an accepted stored preference exists. The
  selection is fixed once casting starts.
- When secure randomness is unavailable, the start button and explanation
  reflect the selected method: automatic casting is declined; User cast can
  start. Switching in either direction and returning after a result recomputes
  the state. No insecure random source is used.
- Consent controls the existing method preference only. Restored manual
  selection starts with a blank question and no lines; withdrawal deletes
  the existing key immediately while preserving the session selection.

## Manual entry

- The casting screen shows the growing figure, line number and progress,
  instructions for obtaining the final 6–9 value, and a native radio group
  with distinct visible numbered targets: 6 old yin changing/broken, 7 young
  yang stable/solid, 8 young yin stable/broken, and 9 old yang changing/solid.
  Each entire labelled target is clickable/tappable and at least 44 by 44 CSS
  pixels; selected state is visible and programmatically exposed. There is no
  text or numeric input for a line value, so selection does not open a numeric
  keyboard. The optional question field is unchanged.
- No value is preselected. Add line is disabled until a valid value is
  selected. A selection does not itself commit a line. Each successful Add
  consumes the selection, appends one line bottom-up, and updates the figure
  and progress. Repeated Add events without a fresh selection do not add lines.
- Undo last line is disabled at zero confirmed lines. Otherwise, until the
  sixth is confirmed, it removes exactly the latest line, clears the pending
  selection, and updates the displayed figure and progress. It may be repeated.
- Validate the exact four values at the UI and core boundaries; controls are
  not a security boundary and their values may be manipulated. Invalid or
  missing submissions, including tampered controls or programmatic calls,
  leave the cast unchanged and surface an accessible explanation. Manual
  casting neither displays nor executes Reveal all or the automatic timer.
- The sixth Add immediately opens the existing result; no partial or seventh
  line can produce or modify a result. Changing and stable results use the
  same rendering, summaries, attribution and question echo as automatic casts.

## Focus and announcements

- All controls work by keyboard with visible focus and meaningful labels.
  The current line is named in text, including bottom/top orientation.
- Selecting a value, committing or undoing it, progress, errors and results
  are available to screen readers without relying on glyphs or color.
  Announce both final-line confirmation and resulting hexagram without one
  overwriting the other in the single live region; a single combined message
  is acceptable. Keep the final outcome available in the result itself.
- After Add or Undo, move focus to the first numbered choice for the next
  line and announce its position; after the sixth Add, move focus to the
  result heading. When Cast
  again returns to the question step, focus must reach its visible heading.

## Reset, layout and privacy

Cast again clears the question, pending selection, line slots, confirmed lines,
result and disclosure content/state while retaining the selected method in
session. The interface wraps without horizontal overflow on narrow screens
and at 200% zoom, retains existing light/dark AA contrast, and respects
reduced motion. No question, value, result, or physical-tool metadata is
stored or transmitted; no network or new external asset is introduced.
