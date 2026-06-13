/**
 * MamaLang Compiler
 *
 * Orchestrates: source → tokens → AST → JavaScript output.
 * This is the single entry-point that all other tools (CLI, REPL, tests)
 * should use.
 */

import { Lexer, LexError }     from './lexer/lexer';
import { Parser, ParseError }  from './parser/parser';
import { Generator }           from './generator/generator';
import { RUNTIME_POSTAMBLE }   from './generator/generator';
import * as AST                from './ast/nodes';

export { LexError, ParseError };

// ── Compiler Result ───────────────────────────────────────────────────────────

export interface CompileResult {
  /** The compiled JavaScript code. */
  js: string;
  /** The AST, exposed for tooling / testing. */
  ast: AST.Program;
  /** Any non-fatal warnings collected during compilation. */
  warnings: string[];
}

export interface CompileOptions {
  /** Filename for error messages and source-map comments. */
  filename?: string;
  /** If true, omit the async IIFE wrapper (useful for REPL eval). */
  noWrapper?: boolean;
}

// ── Compiler Error ────────────────────────────────────────────────────────────

export class CompileError extends Error {
  constructor(
    message: string,
    public readonly phase: 'lex' | 'parse' | 'generate',
    public readonly line?: number,
    public readonly column?: number,
    public readonly filename?: string,
  ) {
    const loc = line != null ? ` (${filename ?? 'unknown'}:${line}:${column})` : '';
    super(`[MamaLang] ${phase.toUpperCase()} ERROR${loc}: ${message}`);
    this.name = 'CompileError';
  }
}

// ── Compiler ──────────────────────────────────────────────────────────────────

export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const { filename = '<unknown>', noWrapper = false } = options;
  const warnings: string[] = [];

  // 1. Lex
  let tokens;
  try {
    tokens = new Lexer(source).tokenize();
  } catch (err) {
    if (err instanceof LexError) {
      throw new CompileError(err.message, 'lex', err.line, err.column, filename);
    }
    throw err;
  }

  // 2. Parse
  let ast: AST.Program;
  try {
    ast = new Parser(tokens).parse();
  } catch (err) {
    if (err instanceof ParseError) {
      throw new CompileError(err.message, 'parse', err.line, err.column, filename);
    }
    throw err;
  }

  // 3. Generate
  let js: string;
  try {
    const gen = new Generator();
    const body = gen.generate(ast);
    js = noWrapper ? body : body + RUNTIME_POSTAMBLE;
  } catch (err) {
    throw new CompileError(String(err), 'generate', undefined, undefined, filename);
  }

  // 4. Append source-map stub comment
  js += `\n//# sourceURL=${filename}\n`;

  return { js, ast, warnings };
}

// ── Version ───────────────────────────────────────────────────────────────────

export const VERSION = '1.0.0';
