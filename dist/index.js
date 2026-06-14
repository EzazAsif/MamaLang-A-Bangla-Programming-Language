"use strict";
/**
 * MamaLang Compiler
 *
 * Orchestrates: source → tokens → AST → JavaScript output.
 * This is the single entry-point that all other tools (CLI, REPL, tests)
 * should use.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.CompileError = exports.ParseError = exports.LexError = void 0;
exports.compile = compile;
const lexer_1 = require("./lexer/lexer");
Object.defineProperty(exports, "LexError", { enumerable: true, get: function () { return lexer_1.LexError; } });
const parser_1 = require("./parser/parser");
Object.defineProperty(exports, "ParseError", { enumerable: true, get: function () { return parser_1.ParseError; } });
const generator_1 = require("./generator/generator");
const generator_2 = require("./generator/generator");
// ── Compiler Error ────────────────────────────────────────────────────────────
class CompileError extends Error {
    constructor(message, phase, line, column, filename) {
        const loc = line != null ? ` (${filename ?? 'unknown'}:${line}:${column})` : '';
        super(`[MamaLang] ${phase.toUpperCase()} ERROR${loc}: ${message}`);
        this.phase = phase;
        this.line = line;
        this.column = column;
        this.filename = filename;
        this.name = 'CompileError';
    }
}
exports.CompileError = CompileError;
// ── Compiler ──────────────────────────────────────────────────────────────────
function compile(source, options = {}) {
    const { filename = '<unknown>', noWrapper = false } = options;
    const warnings = [];
    // 1. Lex
    let tokens;
    try {
        tokens = new lexer_1.Lexer(source).tokenize();
    }
    catch (err) {
        if (err instanceof lexer_1.LexError) {
            throw new CompileError(err.message, 'lex', err.line, err.column, filename);
        }
        throw err;
    }
    // 2. Parse
    let ast;
    try {
        ast = new parser_1.Parser(tokens).parse();
    }
    catch (err) {
        if (err instanceof parser_1.ParseError) {
            throw new CompileError(err.message, 'parse', err.line, err.column, filename);
        }
        throw err;
    }
    // 3. Generate
    let js;
    try {
        const gen = new generator_1.Generator();
        const body = gen.generate(ast);
        js = noWrapper ? body : body + generator_2.RUNTIME_POSTAMBLE;
    }
    catch (err) {
        throw new CompileError(String(err), 'generate', undefined, undefined, filename);
    }
    // 4. Append source-map stub comment
    js += `\n//# sourceURL=${filename}\n`;
    return { js, ast, warnings };
}
// ── Version ───────────────────────────────────────────────────────────────────
exports.VERSION = '1.0.0';
//# sourceMappingURL=index.js.map