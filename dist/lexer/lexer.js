"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.LexError = void 0;
exports.tokenize = tokenize;
const tokens_1 = require("./tokens");
/** Error thrown when the lexer encounters an unexpected character. */
class LexError extends Error {
    constructor(message, line, column, source) {
        super(`[LexError] Line ${line}:${column} – ${message}`);
        this.line = line;
        this.column = column;
        this.source = source;
        this.name = 'LexError';
    }
}
exports.LexError = LexError;
// ── Compound "mama X" keyword table ──────────────────────────────────────────
// Maps the word that follows "mama " to the corresponding TokenType.
const MAMA_KEYWORDS = {
    dhori: tokens_1.TokenType.MAMA_DHORI,
    pakka: tokens_1.TokenType.MAMA_PAKKA,
    bolo: tokens_1.TokenType.MAMA_BOLO,
    jodi: tokens_1.TokenType.MAMA_JODI,
    nahole: tokens_1.TokenType.MAMA_NAHOLE,
    ghuro: tokens_1.TokenType.MAMA_GHURO,
    jotokkhon: tokens_1.TokenType.MAMA_JOTOKKHON,
    kaj: tokens_1.TokenType.MAMA_KAJ,
    ferot: tokens_1.TokenType.MAMA_FEROT,
    opekkha: tokens_1.TokenType.MAMA_OPEKKHA,
    shotto: tokens_1.TokenType.MAMA_SHOTTO,
    miththa: tokens_1.TokenType.MAMA_MITHTHA,
    khali: tokens_1.TokenType.MAMA_KHALI,
    hasi: tokens_1.TokenType.MAMA_HASI,
    kanna: tokens_1.TokenType.MAMA_KANNA,
    ghum: tokens_1.TokenType.MAMA_GHUM,
    panic: tokens_1.TokenType.MAMA_PANIC,
    dhora: tokens_1.TokenType.MAMA_DHORA,
};
class Lexer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }
    // ── Public API ─────────────────────────────────────────────────────────────
    tokenize() {
        while (!this.isEnd()) {
            this.scanToken();
        }
        this.tokens.push(this.makeToken(tokens_1.TokenType.EOF, ''));
        return this.tokens;
    }
    // ── Core scanner ───────────────────────────────────────────────────────────
    scanToken() {
        const ch = this.peek();
        // Skip horizontal whitespace (space / tab / carriage-return)
        if (ch === ' ' || ch === '\t' || ch === '\r') {
            this.advance();
            return;
        }
        // Newlines are statement separators
        if (ch === '\n') {
            this.tokens.push(this.makeToken(tokens_1.TokenType.NEWLINE, '\n'));
            this.advance();
            this.line++;
            this.column = 1;
            return;
        }
        // Single-line comments
        if (ch === '/' && this.peekNext() === '/') {
            while (!this.isEnd() && this.peek() !== '\n')
                this.advance();
            return;
        }
        // String literals (single or double quoted)
        if (ch === '"' || ch === "'") {
            this.readString(ch);
            return;
        }
        // Numbers
        if (this.isDigit(ch)) {
            this.readNumber();
            return;
        }
        // Identifiers and "mama …" keywords
        if (this.isAlpha(ch)) {
            this.readWord();
            return;
        }
        // Operators and punctuation
        this.readPunctuation();
    }
    // ── Readers ────────────────────────────────────────────────────────────────
    readString(quote) {
        const startCol = this.column;
        this.advance(); // opening quote
        let value = '';
        while (!this.isEnd() && this.peek() !== quote) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            }
            if (this.peek() === '\\') {
                this.advance();
                const esc = this.advance();
                switch (esc) {
                    case 'n':
                        value += '\n';
                        break;
                    case 't':
                        value += '\t';
                        break;
                    case '\\':
                        value += '\\';
                        break;
                    case '"':
                        value += '"';
                        break;
                    case "'":
                        value += "'";
                        break;
                    default: value += '\\' + esc;
                }
            }
            else {
                value += this.advance();
            }
        }
        if (this.isEnd()) {
            throw new LexError('Unterminated string literal', this.line, startCol);
        }
        this.advance(); // closing quote
        // Store with original quotes so the code generator can emit them verbatim
        this.tokens.push({
            type: tokens_1.TokenType.STRING,
            value: `${quote}${value}${quote}`,
            line: this.line,
            column: startCol,
        });
    }
    readNumber() {
        const startCol = this.column;
        let value = '';
        while (!this.isEnd() && this.isDigit(this.peek())) {
            value += this.advance();
        }
        if (!this.isEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
            value += this.advance(); // consume '.'
            while (!this.isEnd() && this.isDigit(this.peek()))
                value += this.advance();
        }
        this.tokens.push({ type: tokens_1.TokenType.NUMBER, value, line: this.line, column: startCol });
    }
    readWord() {
        const startCol = this.column;
        let word = '';
        while (!this.isEnd() && this.isAlphaNumeric(this.peek())) {
            word += this.advance();
        }
        if (word === 'mama') {
            // Peek ahead (skip spaces) to see if the next word is a keyword
            this.skipSpaces();
            const kwStart = this.pos;
            let kw = '';
            while (!this.isEnd() && this.isAlphaNumeric(this.peek())) {
                kw += this.advance();
            }
            const type = MAMA_KEYWORDS[kw];
            if (type !== undefined) {
                this.tokens.push({
                    type,
                    value: `mama ${kw}`,
                    line: this.line,
                    column: startCol,
                });
            }
            else {
                // Not a recognised keyword: emit "mama" as an identifier, then rewind
                // the secondary word so it gets scanned as a fresh token.
                this.pos = kwStart;
                this.column = startCol + 5; // approximate (past "mama ")
                this.tokens.push({ type: tokens_1.TokenType.IDENTIFIER, value: 'mama', line: this.line, column: startCol });
            }
            return;
        }
        // Plain identifier
        this.tokens.push({ type: tokens_1.TokenType.IDENTIFIER, value: word, line: this.line, column: startCol });
    }
    readPunctuation() {
        const startCol = this.column;
        const ch = this.advance();
        const emit = (type, value) => this.tokens.push({ type, value, line: this.line, column: startCol });
        switch (ch) {
            case '(':
                emit(tokens_1.TokenType.LPAREN, '(');
                break;
            case ')':
                emit(tokens_1.TokenType.RPAREN, ')');
                break;
            case '{':
                emit(tokens_1.TokenType.LBRACE, '{');
                break;
            case '}':
                emit(tokens_1.TokenType.RBRACE, '}');
                break;
            case '[':
                emit(tokens_1.TokenType.LBRACKET, '[');
                break;
            case ']':
                emit(tokens_1.TokenType.RBRACKET, ']');
                break;
            case ',':
                emit(tokens_1.TokenType.COMMA, ',');
                break;
            case ';':
                emit(tokens_1.TokenType.SEMICOLON, ';');
                break;
            case ':':
                emit(tokens_1.TokenType.COLON, ':');
                break;
            case '.':
                emit(tokens_1.TokenType.DOT, '.');
                break;
            case '%':
                emit(tokens_1.TokenType.PERCENT, '%');
                break;
            case '+':
                if (this.match('+'))
                    emit(tokens_1.TokenType.PLUS_PLUS, '++');
                else if (this.match('='))
                    emit(tokens_1.TokenType.PLUS_EQ, '+=');
                else
                    emit(tokens_1.TokenType.PLUS, '+');
                break;
            case '-':
                if (this.match('-'))
                    emit(tokens_1.TokenType.MINUS_MINUS, '--');
                else if (this.match('='))
                    emit(tokens_1.TokenType.MINUS_EQ, '-=');
                else
                    emit(tokens_1.TokenType.MINUS, '-');
                break;
            case '*':
                emit(tokens_1.TokenType.STAR, '*');
                break;
            case '/':
                // Block comments /* … */
                if (this.match('*')) {
                    while (!this.isEnd() && !(this.peek() === '*' && this.peekNext() === '/')) {
                        if (this.advance() === '\n') {
                            this.line++;
                            this.column = 1;
                        }
                    }
                    if (!this.isEnd()) {
                        this.advance();
                        this.advance();
                    } // consume */
                }
                else {
                    emit(tokens_1.TokenType.SLASH, '/');
                }
                break;
            case '=':
                if (this.match('=')) {
                    if (this.match('='))
                        emit(tokens_1.TokenType.EQ_EQ_EQ, '===');
                    else
                        emit(tokens_1.TokenType.EQ_EQ, '==');
                }
                else {
                    emit(tokens_1.TokenType.EQ, '=');
                }
                break;
            case '!':
                if (this.match('=')) {
                    if (this.match('='))
                        emit(tokens_1.TokenType.BANG_EQ_EQ, '!==');
                    else
                        emit(tokens_1.TokenType.BANG_EQ, '!=');
                }
                else {
                    emit(tokens_1.TokenType.BANG, '!');
                }
                break;
            case '<':
                if (this.match('='))
                    emit(tokens_1.TokenType.LT_EQ, '<=');
                else
                    emit(tokens_1.TokenType.LT, '<');
                break;
            case '>':
                if (this.match('='))
                    emit(tokens_1.TokenType.GT_EQ, '>=');
                else
                    emit(tokens_1.TokenType.GT, '>');
                break;
            case '&':
                if (this.match('&'))
                    emit(tokens_1.TokenType.AND, '&&');
                else
                    throw new LexError(`Unexpected character '&'`, this.line, startCol);
                break;
            case '|':
                if (this.match('|'))
                    emit(tokens_1.TokenType.OR, '||');
                else
                    throw new LexError(`Unexpected character '|'`, this.line, startCol);
                break;
            default:
                throw new LexError(`Unexpected character '${ch}'`, this.line, startCol);
        }
    }
    // ── Helpers ────────────────────────────────────────────────────────────────
    peek() { return this.source[this.pos] ?? ''; }
    peekNext() { return this.source[this.pos + 1] ?? ''; }
    isEnd() { return this.pos >= this.source.length; }
    advance() {
        const ch = this.source[this.pos++];
        this.column++;
        return ch;
    }
    match(expected) {
        if (this.isEnd() || this.source[this.pos] !== expected)
            return false;
        this.advance();
        return true;
    }
    skipSpaces() {
        while (!this.isEnd() && (this.peek() === ' ' || this.peek() === '\t'))
            this.advance();
    }
    makeToken(type, value) {
        return { type, value, line: this.line, column: this.column };
    }
    isDigit(ch) { return ch >= '0' && ch <= '9'; }
    isAlpha(ch) { return /[a-zA-Z_$]/.test(ch); }
    isAlphaNumeric(ch) { return /[a-zA-Z0-9_$]/.test(ch); }
}
exports.Lexer = Lexer;
// ── Convenience export ────────────────────────────────────────────────────────
/** Tokenise MamaLang source and return the token array. */
function tokenize(source) {
    return new Lexer(source).tokenize();
}
//# sourceMappingURL=lexer.js.map