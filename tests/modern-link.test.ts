import { test } from "node:test";
import assert from "node:assert/strict";
import { CORPUS_ATTRIBUTION } from "../src/data/texts.ts";
import {
  FOOTER_NOTE,
  LEGGE_WIKI_MARKER,
  MODERN_GUIDE_LINK_LABEL,
  MODERN_GUIDE_URL
} from "../src/data/app-strings.ts";
import { renderAttribution } from "../src/ui/attribution.ts";

class MockNode {
  children: MockNode[] = [];
  text = "";
  href = "";
  target = "";
  rel = "";
  title = "";
  nodeName: string;
  constructor(nodeName: string) { this.nodeName = nodeName; }
  set textContent(value: string) { this.children = []; this.text = value; }
  get textContent(): string { return this.text + this.children.map((child) => child.textContent).join(""); }
  appendChild(child: MockNode): MockNode { this.children.push(child); return child; }
  replaceChildren(): void { this.children = []; this.text = ""; }
}

test("the runtime attribution creates one safe, named, relative guide link", () => {
  const previous = globalThis.document;
  const mockDocument = {
    createElement: (tag: string) => new MockNode(tag),
    createTextNode: (text: string) => {
      const node = new MockNode("#text");
      node.text = text;
      return node;
    }
  };
  globalThis.document = mockDocument as unknown as Document;
  try {
    const root = new MockNode("footer");
    renderAttribution(root as unknown as HTMLElement);
    const links = root.children.filter((child) => child.nodeName === "a");
    const guideLinks = links.filter((link) => link.href === MODERN_GUIDE_URL);
    assert.equal(guideLinks.length, 1);
    const [guide] = guideLinks;
    assert.ok(guide);
    assert.equal(guide.textContent, MODERN_GUIDE_LINK_LABEL);
    assert.equal(guide.target, "_blank");
    assert.equal(guide.rel, "noopener noreferrer");
    assert.equal(guide.href, "modern-guide.html");
    assert.ok(!guide.href.includes("?") && !guide.href.includes("#"));
    assert.ok(root.textContent.includes(LEGGE_WIKI_MARKER));
    assert.ok(root.textContent.includes(FOOTER_NOTE));
  } finally {
    globalThis.document = previous;
  }
});

test("the guide remains a plain standalone relative target with no consultation state", () => {
  assert.equal(MODERN_GUIDE_URL, "modern-guide.html");
  assert.equal(MODERN_GUIDE_URL.includes("?"), false);
  assert.equal(MODERN_GUIDE_URL.includes("#"), false);
  assert.equal(MODERN_GUIDE_URL.includes("://"), false);
  assert.match(MODERN_GUIDE_LINK_LABEL, /opens separately/i);
  assert.ok(CORPUS_ATTRIBUTION.length > 0);
});
