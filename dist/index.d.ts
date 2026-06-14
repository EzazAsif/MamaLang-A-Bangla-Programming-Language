/**
 * MamaLang Compiler
 *
 * Orchestrates: source → tokens → AST → JavaScript output.
 * This is the single entry-point that all other tools (CLI, REPL, tests)
 * should use.
 */
import { LexError } from './lexer/lexer';
import { ParseError } from './parser/parser';
import * as AST from './ast/nodes';
export { LexError, ParseError };
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
export declare class CompileError extends Error {
    readonly phase: 'lex' | 'parse' | 'generate';
    readonly line?: number;
    readonly column?: number;
    readonly filename?: string;
    constructor(message: string, phase: 'lex' | 'parse' | 'generate', line?: number, column?: number, filename?: string);
}
export declare function compile(source: string, options?: CompileOptions): CompileResult;
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map