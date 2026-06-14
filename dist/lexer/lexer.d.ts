/**
 * MamaLang Lexer
 *
 * Converts raw MamaLang source text into a flat array of Tokens.
 * The lexer is hand-written (no external lexer generator needed for this
 * keyword-heavy language) and processes the input left-to-right in one pass.
 *
 * Key design points:
 * - "mama <keyword>" pairs are recognised as single compound tokens so the
 *   parser doesn't have to deal with the raw "mama" word.
 * - Single-line comments start with "//" and are silently discarded.
 * - Newlines are emitted as NEWLINE tokens so the parser can use them as
 *   optional statement separators (same trick as JavaScript ASI).
 */
import { Token } from './tokens';
/** Error thrown when the lexer encounters an unexpected character. */
export declare class LexError extends Error {
    readonly line: number;
    readonly column: number;
    readonly source?: string;
    constructor(message: string, line: number, column: number, source?: string);
}
export declare class Lexer {
    private readonly source;
    private pos;
    private line;
    private column;
    private tokens;
    constructor(source: string);
    tokenize(): Token[];
    private scanToken;
    private readString;
    private readNumber;
    private readWord;
    private readPunctuation;
    private peek;
    private peekNext;
    private isEnd;
    private advance;
    private match;
    private skipSpaces;
    private makeToken;
    private isDigit;
    private isAlpha;
    private isAlphaNumeric;
}
/** Tokenise MamaLang source and return the token array. */
export declare function tokenize(source: string): Token[];
//# sourceMappingURL=lexer.d.ts.map