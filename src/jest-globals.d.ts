/**
 * Minimal Jest global type declarations.
 * This file replaces @types/jest so the test suite type-checks without
 * needing to run `npm install` first. After running `npm install`, the
 * real @types/jest package in node_modules takes precedence.
 */

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: (done?: (err?: unknown) => void) => void | Promise<void>): void;
declare function test(name: string, fn: (done?: (err?: unknown) => void) => void | Promise<void>): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;
declare function beforeAll(fn: () => void | Promise<void>): void;
declare function afterAll(fn: () => void | Promise<void>): void;

declare namespace jest {
  function fn(impl?: (...args: any[]) => any): any;
  function spyOn(obj: any, method: string): any;
  function mock(moduleName: string, factory?: () => any): void;
  function clearAllMocks(): void;
  function resetAllMocks(): void;
  function useFakeTimers(): void;
  function useRealTimers(): void;
}

interface JestMatchers<T> {
  toBe(expected: T): void;
  toEqual(expected: unknown): void;
  toStrictEqual(expected: unknown): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNaN(): void;
  toContain(expected: unknown): void;
  toContainEqual(expected: unknown): void;
  toHaveLength(expected: number): void;
  toHaveProperty(path: string, value?: unknown): void;
  toThrow(expected?: string | RegExp | Error | (new (...args: any[]) => Error)): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, precision?: number): void;
  toMatch(expected: string | RegExp): void;
  toMatchObject(expected: object): void;
  toBeInstanceOf(expected: unknown): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(n: number): void;
  toHaveBeenCalledWith(...args: unknown[]): void;
  not: JestMatchers<T>;
  resolves: JestMatchers<T>;
  rejects: JestMatchers<T>;
}

declare function expect<T>(actual: T): JestMatchers<T>;
