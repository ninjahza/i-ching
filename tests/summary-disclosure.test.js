import { test } from "node:test";
import assert from "node:assert/strict";
import { presentSummary, toggleSummary, clearSummary } from "../src/ui/summary-disclosure.ts";

function elements() {
  const attributes = new Map();
  return {
    toggle: {
      textContent: "",
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: (name) => attributes.delete(name),
      getAttribute: (name) => attributes.get(name)
    },
    region: { hidden: true },
    first: { textContent: "" },
    second: { textContent: "", hidden: true }
  };
}

test("summary is literal text, starts collapsed and resets after repeated toggles", () => {
  const card = elements();
  presentSummary(card, "<script>literal</script>\n\nSecond paragraph.", 1);
  assert.equal(card.first.textContent, "<script>literal</script>");
  assert.equal(card.second.textContent, "Second paragraph.");
  assert.equal(card.second.hidden, false);
  assert.equal(card.region.hidden, true);
  assert.equal(card.toggle.getAttribute("aria-expanded"), "false");
  assert.equal(card.toggle.getAttribute("aria-label"), "Read more: hexagram 1");
  toggleSummary(card, 1);
  assert.equal(card.region.hidden, false);
  assert.equal(card.toggle.getAttribute("aria-label"), "Show less: hexagram 1");
  for (let i = 0; i < 10; i++) toggleSummary(card, 1);
  assert.equal(card.first.textContent, "<script>literal</script>");
  clearSummary(card);
  assert.equal(card.first.textContent, "");
  assert.equal(card.second.textContent, "");
  assert.equal(card.second.hidden, true);
  assert.equal(card.region.hidden, true);
  assert.equal(card.toggle.getAttribute("aria-expanded"), "false");
});

test("primary and related disclosures operate independently", () => {
  const primary = elements();
  const related = elements();
  presentSummary(primary, "Primary.", 1);
  presentSummary(related, "Related.", 2);
  assert.equal(primary.second.hidden, true);
  toggleSummary(related, 2);
  assert.equal(primary.region.hidden, true);
  assert.equal(related.region.hidden, false);
  toggleSummary(primary, 1);
  toggleSummary(related, 2);
  assert.equal(primary.region.hidden, false);
  assert.equal(related.region.hidden, true);
  clearSummary(primary);
  clearSummary(related);
  assert.equal(primary.first.textContent, "");
  assert.equal(related.first.textContent, "");
});
