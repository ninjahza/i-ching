# Research Decisions: User Cast

## Shared consultation, distinct input modes

**Decision**: Extend the existing consultation aggregate with a typed manual
mode and a shared validated append path. Automatic mode continues to draw
through its existing `CastingMethod` and `RandomSource`; manual mode supplies
a value directly and supports undo. Both use the same result derivation.

**Rationale**: `consultation.ts` already owns completion, bottom-up positions,
question normalization, and derived results. `pattern.ts` and `hexagram.ts`
already implement the canonical bit order, changing mask, lookup and related
hexagram. Reuse prevents separate interpretation rules from drifting.

**Alternatives considered**: A parallel manual hexagram engine duplicates
canonical rules; presenting manual mode as a `CastingMethod.draw` invents a
probability profile and couples entry to randomness. Both are rejected.

## Explicit selection and confirmation

**Decision**: Use a native radio group for 6–9, with large clickable/tappable
numbered labels (at least 44 by 44 CSS pixels each), and a separate Add line
button. Do not provide a line-value text or numeric field. Selection is
cleared after add or undo; Undo removes only the last confirmed line. The
sixth add presents the existing result immediately.

**Rationale**: A discrete, labelled set avoids typed line values and makes
selection easier on touch devices while enabling deliberate repeated values,
keyboard operation and correction. It limits ordinary invalid input, but
controls can be manipulated: validate at both UI and core boundaries.
Confirmed lines live in the aggregate; an unconfirmed selection belongs to
the transient UI controller.

**Alternatives considered**: Free-text numeric input requires typing and
permits more malformed states; instant-commit value buttons make accidental
repeated activation harder to distinguish from intent. A review screen is
outside the spec.

## Capability and preferences

**Decision**: Model the UI's three method identifiers independently of the
two automatic `CastingMethod` profiles. Manual mode requires no random
source. Automatic modes require the injected secure source and capability
established at boot, with no global re-probe or weaker fallback. Extend the
existing consented `iching.method` value set, not the storage key set.

**Rationale**: Today both `ui/main.ts` and `ui/steps.ts` gate all casts on
random availability, while `method-pref.ts` derives its type from automatic
profiles. Those assumptions must change together for manual casting to work
with missing crypto. Existing stored `coins` and `yarrow` remain valid.

**Alternatives considered**: An unconditional RNG requirement blocks the
feature on unsupported devices; a new storage key expands the privacy
surface; fabricating a random source for manual entry obscures the contract.

## UI and verification

**Decision**: Extend the current shell, figure slots, step controller and
announcer, retaining the existing palette and composition. Verify state with
focused automated tests, all 4,096 inputs with an independently calculated
bit oracle, and the actual built page with keyboard and assistive technology.

**Rationale**: This is a task-oriented extension of an established surface,
not a redesign. Static checks do not prove focus, live-region behavior, zoom,
or physical-device usability. Existing tests use Node's test runner without
a browser runtime dependency.

**Alternatives considered**: A separate screen or visual system adds
unnecessary complexity; source-only UI assertions miss browser behavior.
