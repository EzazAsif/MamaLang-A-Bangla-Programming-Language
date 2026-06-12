/**
 * Minimal Node.js global type declarations.
 * This file replaces @types/node so the project compiles without needing
 * to run `npm install` first. After running `npm install`, the real
 * @types/node package takes precedence via node_modules.
 */

declare var process: {
  argv: string[];
  exit(code?: number): never;
  env: Record<string, string | undefined>;
  version: string;
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream & { write(s: string): boolean };
  stderr: NodeJS.WritableStream;
  cwd(): string;
};

declare var require: {
  (id: string): any;
  resolve(id: string): string;
  cache: Record<string, any>;
  main?: NodeModule;
};

declare var __dirname: string;
declare var __filename: string;

declare var setTimeout: (fn: (...args: any[]) => void, ms?: number, ...args: any[]) => any;
declare var clearTimeout: (id: any) => void;
declare var setInterval: (fn: (...args: any[]) => void, ms?: number, ...args: any[]) => any;
declare var clearInterval: (id: any) => void;

declare var console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare var Buffer: {
  from(data: string | ArrayBuffer, encoding?: string): Buffer;
  alloc(size: number): Buffer;
  isBuffer(obj: any): boolean;
};

interface Buffer extends Uint8Array {
  toString(encoding?: string): string;
}

declare interface NodeModule {
  exports: any;
  filename: string;
  id: string;
}

declare namespace NodeJS {
  interface ReadableStream {
    on(event: string, listener: (...args: any[]) => void): this;
    pipe(destination: any): any;
  }
  interface WritableStream {
    write(chunk: any, encoding?: string, callback?: () => void): boolean;
    end(chunk?: any, encoding?: string, callback?: () => void): void;
  }
}

// Node built-in modules used in the CLI
declare module 'fs' {
  function readFileSync(path: string, encoding: string): string;
  function writeFileSync(path: string, data: string): void;
  function existsSync(path: string): boolean;
  function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  function unlinkSync(path: string): void;
}

declare module 'path' {
  function resolve(...parts: string[]): string;
  function join(...parts: string[]): string;
  function basename(p: string, ext?: string): string;
  function dirname(p: string): string;
  function extname(p: string): string;
}

declare module 'os' {
  function tmpdir(): string;
}

declare module 'readline' {
  interface Interface {
    prompt(): void;
    on(event: string, listener: (...args: any[]) => void): this;
    close(): void;
  }
  interface CreateInterfaceOptions {
    input: any;
    output: any;
    prompt?: string;
  }
  function createInterface(options: CreateInterfaceOptions): Interface;
}

declare module 'child_process' {
  function exec(
    command: string,
    callback: (error: Error | null, stdout: string, stderr: string) => void,
  ): any;
}

declare module 'commander' {
  class Command {
    name(str: string): this;
    description(str: string): this;
    version(str: string, flags?: string): this;
    command(nameAndArgs: string): Command;
    option(flags: string, description?: string, defaultValue?: any): this;
    action(fn: (...args: any[]) => void | Promise<void>): this;
    parse(argv: string[]): this;
  }
}
