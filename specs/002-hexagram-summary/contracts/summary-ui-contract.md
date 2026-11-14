# UI Contract: Hexagram Summary Disclosure

## Surface

The Result screen exposes a summary disclosure inside each displayed hexagram card. It is an in-place enhancement to the offline application; it introduces no route, API, network request, or persistent preference.

## Contract

| Condition/action | Required observable behavior |
|---|---|
| Result first appears | Primary summary is present in the data but hidden; its native disclosure button is available and reports collapsed state. |
| Related hexagram exists | Its card has a separate disclosure button and summary region, also initially collapsed. |
| Stable hexagram | No related card or related summary control is rendered. |
| Activate a disclosure button | Toggle only its associated card's summary; update the visible label (for example, “Read more” / “Show less”) and `aria-expanded`. |
| Activate the related disclosure | Keep the primary disclosure state unchanged, and vice versa. |
| Summary becomes visible | Show a brief framing label that identifies the content as an overview of Legge's commentary, separate from the Judgement and Image blockquotes. Render paragraphs as inert literal text. |
| Keyboard/screen-reader use | Native button is keyboard-operable, focus remains on it after toggling, and its accessible name/context identifies the hexagram; expanded/collapsed state and controlled region are programmatically associated. |
| “Cast again” | Clear rendered summary content, collapse/reset all disclosures, and return to the new consultation with no prior result state. |
| Any toggle | Read/write no browser storage and make no network request. |

## Accessibility and presentation

- Preserve a visible focus indicator and semantic control/region association.
- Work independently in existing light and dark color schemes with WCAG 2.1 AA contrast.
- Wrap naturally on narrow viewports and at 200% zoom without horizontal overflow.
- Respect `prefers-reduced-motion`; no motion is required for the disclosure.
- Keep summary typography and framing visibly distinct from the verbatim quotation blocks.

## Security

The summary is plain data. It must be rendered through text nodes/`textContent` and static DOM elements, never HTML parsing or injection. The interaction must not introduce external assets, runtime dependencies, dynamic code execution, storage, or network activity.
