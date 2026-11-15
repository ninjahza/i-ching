// Shared zero-dependency DOM test environment built directly from src/shell/index.html.
import { readFileSync } from "node:fs";

export function createDomEnvironment({ storageInitial = null, timers = null } = {}) {
  const html = readFileSync("src/shell/index.html", "utf8");
  const prevGlobals = {
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    HTMLElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLElement"),
    HTMLButtonElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLButtonElement"),
    HTMLInputElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLInputElement"),
    HTMLTextAreaElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLTextAreaElement"),
    HTMLParagraphElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLParagraphElement"),
    HTMLAnchorElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLAnchorElement"),
    localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    setInterval: Object.getOwnPropertyDescriptor(globalThis, "setInterval"),
    clearInterval: Object.getOwnPropertyDescriptor(globalThis, "clearInterval"),
  };

  let docRef = null;

  class TestHTMLElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.nodeName = tagName.toLowerCase();
      this.id = "";
      this.className = "";
      this.hidden = false;
      this.parentNode = null;
      this.children = [];
      this._text = "";
      this.attributes = new Map();
      this.dataset = {};
      this.listeners = new Map();
      this.href = "";
      this.target = "";
      this.rel = "";
      this.title = "";
    }

    setAttribute(name, value) {
      const s = String(value);
      this.attributes.set(name, s);
      if (name === "id") this.id = s;
      else if (name === "class") this.className = s;
      else if (name === "hidden") this.hidden = true;
      else if (name.startsWith("data-")) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        this.dataset[key] = s;
      }
    }

    getAttribute(name) {
      if (name === "id") return this.id || null;
      if (name === "class") return this.className || null;
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    hasAttribute(name) {
      if (name === "hidden") return this.hidden;
      return this.attributes.has(name);
    }

    removeAttribute(name) {
      this.attributes.delete(name);
      if (name === "hidden") this.hidden = false;
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    replaceChildren(...nodes) {
      this.children = [];
      this._text = "";
      for (const n of nodes) this.appendChild(n);
    }

    get firstElementChild() {
      return this.children.find((c) => c instanceof TestHTMLElement) ?? null;
    }

    get textContent() {
      if (this.children.length === 0) return this._text;
      return this._text + this.children.map((c) => c.textContent).join("");
    }

    set textContent(v) {
      this.children = [];
      this._text = String(v);
    }

    isEffectivelyHidden() {
      let cur = this;
      while (cur) {
        if (cur.hidden) return true;
        cur = cur.parentNode;
      }
      return false;
    }

    isFocusable() {
      if (this.isEffectivelyHidden()) return false;
      if (this.disabled) return false;
      if (
        this instanceof TestHTMLButtonElement ||
        this instanceof TestHTMLInputElement ||
        this instanceof TestHTMLTextAreaElement ||
        this instanceof TestHTMLAnchorElement
      ) {
        return true;
      }
      return this.attributes.has("tabindex");
    }

    focus() {
      if (this.isFocusable() && docRef) {
        docRef.activeElement = this;
      }
    }

    addEventListener(type, fn) {
      const list = this.listeners.get(type) ?? [];
      list.push(fn);
      this.listeners.set(type, list);
    }

    dispatchEvent(event) {
      const type = typeof event === "string" ? event : event.type;
      const list = this.listeners.get(type) ?? [];
      for (const fn of list) fn({ type, target: this, currentTarget: this });
      return true;
    }

    click() {
      if (this.isEffectivelyHidden()) return;
      if (this.tagName === "LABEL") {
        const forId = this.getAttribute("for");
        const input = forId
          ? docRef.getElementById(forId)
          : this.querySelector("input");
        if (input && typeof input.click === "function") input.click();
        return;
      }
      this.dispatchEvent({ type: "click" });
    }

    matchesSelector(sel) {
      const s = sel.trim();
      if (s.startsWith("#")) return this.id === s.slice(1);
      const attrRe = /\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]/g;
      for (const m of s.matchAll(attrRe)) {
        const attr = m[1];
        const expected = m[2];
        let actual = null;
        if (attr.startsWith("data-")) {
          const key = attr.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          actual = this.dataset[key] ?? this.getAttribute(attr);
        } else if (attr === "type" && this instanceof TestHTMLInputElement) {
          actual = this.type;
        } else if (attr === "name" && this instanceof TestHTMLInputElement) {
          actual = this.name;
        } else {
          actual = this.getAttribute(attr);
        }
        if (expected !== undefined ? actual !== expected : actual === null) return false;
      }
      const base = s.replace(attrRe, "");
      if (!base) return true;
      const [tagPart, ...classes] = base.split(".");
      if (tagPart && this.nodeName !== tagPart.toLowerCase()) return false;
      const ownClasses = this.className.split(/\s+/).filter(Boolean);
      return classes.every((cls) => ownClasses.includes(cls));
    }

    querySelectorAll(sel) {
      const parts = sel.split(",").map((p) => p.trim()).filter(Boolean);
      const results = [];
      const visit = (node) => {
        for (const child of node.children) {
          if (child instanceof TestHTMLElement) {
            if (parts.some((p) => child.matchesSelector(p))) results.push(child);
            visit(child);
          }
        }
      };
      visit(this);
      return results;
    }

    querySelector(sel) {
      return this.querySelectorAll(sel)[0] ?? null;
    }
  }

  class TestTextNode {
    constructor(text) {
      this.nodeName = "#text";
      this._text = String(text);
    }
    get textContent() {
      return this._text;
    }
    set textContent(v) {
      this._text = String(v);
    }
  }

  class TestHTMLButtonElement extends TestHTMLElement {
    constructor() {
      super("button");
      this.disabled = false;
      this.type = "button";
    }
    setAttribute(name, value) {
      super.setAttribute(name, value);
      if (name === "disabled") this.disabled = true;
      if (name === "type") this.type = String(value);
    }
    removeAttribute(name) {
      super.removeAttribute(name);
      if (name === "disabled") this.disabled = false;
    }
    click() {
      if (this.disabled || this.isEffectivelyHidden()) return;
      this.focus();
      this.dispatchEvent({ type: "click" });
    }
  }

  class TestHTMLInputElement extends TestHTMLElement {
    constructor() {
      super("input");
      this.type = "text";
      this.name = "";
      this.value = "";
      this.checked = false;
      this.disabled = false;
    }
    setAttribute(name, value) {
      super.setAttribute(name, value);
      if (name === "type") this.type = String(value);
      else if (name === "name") this.name = String(value);
      else if (name === "value") this.value = String(value);
      else if (name === "checked") this.checked = true;
      else if (name === "disabled") this.disabled = true;
    }
    click() {
      if (this.disabled || this.isEffectivelyHidden()) return;
      this.focus();
      if (this.type === "radio") {
        const wasChecked = this.checked;
        if (!wasChecked) {
          if (this.name && docRef) {
            for (const other of docRef.root.querySelectorAll(`input[type="radio"][name="${this.name}"]`)) {
              other.checked = other === this;
            }
          } else {
            this.checked = true;
          }
          this.dispatchEvent({ type: "change" });
        }
        this.dispatchEvent({ type: "click" });
      } else if (this.type === "checkbox") {
        this.checked = !this.checked;
        this.dispatchEvent({ type: "change" });
        this.dispatchEvent({ type: "click" });
      } else {
        this.dispatchEvent({ type: "click" });
      }
    }
  }

  class TestHTMLTextAreaElement extends TestHTMLElement {
    constructor() {
      super("textarea");
      this.value = "";
      this.maxLength = 500;
      this.disabled = false;
    }
  }

  class TestHTMLParagraphElement extends TestHTMLElement {
    constructor() {
      super("p");
    }
  }

  class TestHTMLAnchorElement extends TestHTMLElement {
    constructor() {
      super("a");
    }
  }

  function makeElement(tag) {
    const t = tag.toLowerCase();
    if (t === "button") return new TestHTMLButtonElement();
    if (t === "input") return new TestHTMLInputElement();
    if (t === "textarea") return new TestHTMLTextAreaElement();
    if (t === "p") return new TestHTMLParagraphElement();
    if (t === "a") return new TestHTMLAnchorElement();
    return new TestHTMLElement(t);
  }

  const bodyMatch = /<body[^>]*>([\s\S]*?)<script\b/i.exec(html);
  const bodyHtml = bodyMatch ? bodyMatch[1] : "";
  const root = new TestHTMLElement("body");
  const stack = [root];
  const voidTags = new Set(["meta", "br", "hr", "input", "img", "link"]);
  const tokenRe = /<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  const attrParse = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

  for (const m of bodyHtml.matchAll(tokenRe)) {
    const [, closeTag, openTag, rawAttrs, textChunk] = m;
    if (closeTag) {
      if (stack.length > 1) stack.pop();
    } else if (openTag) {
      const el = makeElement(openTag);
      if (rawAttrs) {
        for (const am of rawAttrs.matchAll(attrParse)) {
          const aName = am[1];
          const aVal = am[2] ?? am[3] ?? am[4] ?? "";
          el.setAttribute(aName, aVal);
        }
      }
      stack[stack.length - 1].appendChild(el);
      if (!voidTags.has(openTag.toLowerCase()) && !rawAttrs?.trimEnd().endsWith("/")) {
        stack.push(el);
      }
    } else if (textChunk && textChunk.trim() !== "") {
      const parent = stack[stack.length - 1];
      const cleaned = textChunk.replace(/\s+/g, " ");
      parent.appendChild(new TestTextNode(cleaned));
    }
  }

  docRef = {
    root,
    activeElement: root,
    createElement: (tag) => makeElement(tag),
    createTextNode: (text) => new TestTextNode(text),
    getElementById(id) {
      return root.querySelector(`#${id}`);
    },
    querySelectorAll(sel) {
      return root.querySelectorAll(sel);
    },
    querySelector(sel) {
      return root.querySelector(sel);
    },
  };

  const storageMap = new Map(Object.entries(storageInitial ?? {}));
  const storage = {
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
  };

  const activeTimers = new Map();
  let nextTimerId = 1;
  let intervalCalls = 0;
  const fakeSetInterval = (cb, ms) => {
    intervalCalls++;
    const id = nextTimerId++;
    activeTimers.set(id, { cb, ms });
    if (timers) timers.push({ id, cb, ms });
    return id;
  };
  const fakeClearInterval = (id) => {
    activeTimers.delete(id);
  };

  Object.defineProperty(globalThis, "HTMLElement", { value: TestHTMLElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, "HTMLButtonElement", { value: TestHTMLButtonElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, "HTMLInputElement", { value: TestHTMLInputElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, "HTMLTextAreaElement", { value: TestHTMLTextAreaElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, "HTMLParagraphElement", { value: TestHTMLParagraphElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, "HTMLAnchorElement", { value: TestHTMLAnchorElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, "document", { value: docRef, configurable: true, writable: true });
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
  Object.defineProperty(globalThis, "setInterval", { value: fakeSetInterval, configurable: true, writable: true });
  Object.defineProperty(globalThis, "clearInterval", { value: fakeClearInterval, configurable: true, writable: true });

  return {
    document: docRef,
    storageMap,
    activeTimers,
    getIntervalCalls: () => intervalCalls,
    tickAll() {
      for (const entry of [...activeTimers.values()]) entry.cb();
    },
    restore() {
      for (const [k, desc] of Object.entries(prevGlobals)) {
        if (desc) Object.defineProperty(globalThis, k, desc);
        else delete globalThis[k];
      }
    },
  };
}
