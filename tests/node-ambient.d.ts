// Minimal ambient declarations for the Node test-runtime globals used by tests/.
// The project pins exactly two dev dependencies (typescript, esbuild — B-11),
// so @types/node is deliberately NOT added; this file declares only the tiny
// surface the test suites actually touch.
declare module "node:test" {
  type TestFn = () => void | Promise<void>;
  interface TestOptions { skip?: boolean | string; only?: boolean; timeout?: number }
  export function test(name: string, fn: TestFn): void;
  export function test(name: string, options: TestOptions, fn: TestFn): void;
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: TestFn): void;
  export function before(fn: TestFn): void;
  export function beforeEach(fn: TestFn): void;
}

declare module "node:assert/strict" {
  interface StrictAssert {
    (value: unknown, message?: string): asserts value;
    ok(value: unknown, message?: string): asserts value;
    equal(actual: unknown, expected: unknown, message?: string): void;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    notDeepEqual(actual: unknown, expected: unknown, message?: string): void;
    throws(fn: () => unknown, message?: string): void;
    doesNotThrow(fn: () => unknown, message?: string): void;
    match(value: string, regexp: RegExp, message?: string): void;
    fail(message?: string): never;
  }
  const assert: StrictAssert;
  export default assert;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readdirSync(path: string, options?: { withFileTypes?: false }): string[];
  export function existsSync(path: string): boolean;
  export function statSync(path: string): { isDirectory(): boolean; isFile(): boolean };
}

// Node's ESM runtime surface (url/filename/dirname) without pulling @types/node.
interface ImportMeta {
  readonly url: string;
  readonly filename: string;
  readonly dirname: string;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function relative(from: string, to: string): string;
  export const sep: string;
}
