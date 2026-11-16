# Data Model: User Cast

## Casting choice

The UI selects `coins`, `yarrow`, or a short stable manual identifier such as
`user`. The first two still refer to automatic `CastingMethod` objects with
unchanged probability tables. The manual identifier is a UI/consultation mode,
not an automatic profile. The existing preference key accepts all three only
after consent; old stored values remain valid.

## Consultation

- **Common state**: normalized optional question; fixed method for this cast;
  ordered confirmed `CastLine` entries; state `asking`, `casting`, or
  `complete`; existing primary/related derived data.
- **Automatic mode**: a `CastingMethod` and secure `RandomSource`; a next-line
  operation draws exactly one value as before.
- **Manual mode**: no random source or probability profile; a manual add
  operation validates and appends the provided value, and an undo operation
  removes the latest confirmed line before completion.
- **Confirmed line**: value 6, 7, 8, or 9; position equals the one-based index
  of confirmation (1 bottom, 6 top); changing is derived from value.
- **Pending selection**: UI-only `LineValue | null` from a numbered radio
  choice, never typed, a confirmed line, result input, or stored value.

Use an explicit discriminated mode or equivalent type-safe interface so a
manual operation cannot accidentally invoke `castLine`, and callers can
distinguish available operations. The UI must validate the exact allowlisted
choices even if control values are manipulated; runtime guards in the core
must independently validate supplied values and reject wrong-mode operations.
Existing automatic callers and tests must be updated consistently if the
shared interface changes.

## Invariants and Transitions

| State | Action | Result |
|---|---|---|
| 0–5 confirmed, no selection | Select a valid value | Pending selection changes; confirmed lines do not. |
| 0–5 confirmed, selection present | Select another value | Only pending selection changes. |
| 0–5 confirmed, valid selection | Add | Append exactly one line at `count + 1`; clear selection. If count becomes 6, derive result and show it. |
| 0–5 confirmed, no/invalid selection | Add attempt | Explain the error; leave confirmed lines and progress unchanged. Normal Add control is disabled without a valid selection. |
| 1–5 confirmed | Undo | Remove last line; clear pending selection; refresh figure, progress and announcement. |
| 0 confirmed | Undo attempt | No line removed; normal Undo control disabled. |
| 6 confirmed | Add or undo attempt | Reject explicitly; completed data is unchanged. |
| Any completed consultation | Cast again | Discard question, pending/confirmed data and rendered results; keep session method, start empty. |

No derived result may be accessed before six confirmed values. The shared
pattern sets bit `position - 1` for 7 or 9; the changing mask sets it for 6
or 9. The related pattern is primary XOR mask; mask zero means stable with no
related hexagram. Reopening/reloading discards all consultation state.

The UI must guard Reveal all by mode even if it is invoked programmatically;
manual mode never starts a timer or consumes randomness. Automatic mode
retains existing timed reveal, draw count, and early completion behavior.
