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

import { Token, TokenType } from './tokens';

/** Error thrown when the lexer encounters an unexpected character. */
export class LexError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly source?: string,
  ) {
    super(`[LexError] Line ${line}:${column} – ${message}`);
    this.name = 'LexError';
  }
}

// ── Compound "mama X" keyword table ──────────────────────────────────────────
// Maps the word that follows "mama " to the corresponding TokenType.
const MAMA_KEYWORDS: Record<string, TokenType> = {
  dhori:      TokenType.MAMA_DHORI,
  pakka:      TokenType.MAMA_PAKKA,
  bolo:       TokenType.MAMA_BOLO,
  jodi:       TokenType.MAMA_JODI,
  nahole:     TokenType.MAMA_NAHOLE,
  ghuro:      TokenType.MAMA_GHURO,
  jotokkhon:  TokenType.MAMA_JOTOKKHON,
  kaj:        TokenType.MAMA_KAJ,
  ferot:      TokenType.MAMA_FEROT,
  opekkha:    TokenType.MAMA_OPEKKHA,
  shotto:     TokenType.MAMA_SHOTTO,
  miththa:    TokenType.MAMA_MITHTHA,
  khali:      TokenType.MAMA_KHALI,
  hasi:       TokenType.MAMA_HASI,
  kanna:      TokenType.MAMA_KANNA,
  ghum:       TokenType.MAMA_GHUM,
  panic:      TokenType.MAMA_PANIC,
  dhora:      TokenType.MAMA_DHORA,
};

export class Lexer {
  private pos    = 0;
  private line   = 1;
  private column = 1;
  private tokens: Token[] = [];

  constructor(private readonly source: string) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  tokenize(): Token[] {
    while (!this.isEnd()) {
      this.scanToken();
    }
    this.tokens.push(this.makeToken(TokenType.EOF, ''));
    return this.tokens;
  }

  // ── Core scanner ───────────────────────────────────────────────────────────

  private scanToken(): void {
    const ch = this.peek();

    // Skip horizontal whitespace (space / tab / carriage-return)
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      this.advance();
      return;
    }

    // Newlines are statement separators
    if (ch === '\n') {
      this.tokens.push(this.makeToken(TokenType.NEWLINE, '\n'));
      this.advance();
      this.line++;
      this.column = 1;
      return;
    }

    // Single-line comments
    if (ch === '/' && this.peekNext() === '/') {
      while (!this.isEnd() && this.peek() !== '\n') this.advance();
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

  private readString(quote: string): void {
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
          case 'n':  value += '\n'; break;
          case 't':  value += '\t'; break;
          case '\\': value += '\\'; break;
          case '"':  value += '"'; break;
          case "'":  value += "'"; break;
          default:   value += '\\' + esc;
        }
      } else {
        value += this.advance();
      }
    }
    if (this.isEnd()) {
      throw new LexError('Unterminated string literal', this.line, startCol);
    }
    this.advance(); // closing quote
    // Store with original quotes so the code generator can emit them verbatim
    this.tokens.push({
      type: TokenType.STRING,
      value: `${quote}${value}${quote}`,
      line: this.line,
      column: startCol,
    });
  }

  private readNumber(): void {
    const startCol = this.column;
    let value = '';
    while (!this.isEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    if (!this.isEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // consume '.'
      while (!this.isEnd() && this.isDigit(this.peek())) value += this.advance();
    }
    this.tokens.push({ type: TokenType.NUMBER, value, line: this.line, column: startCol });
  }

  private readWord(): void {
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
      } else {
        // Not a recognised keyword: emit "mama" as an identifier, then rewind
        // the secondary word so it gets scanned as a fresh token.
        this.pos = kwStart;
        this.column = startCol + 5; // approximate (past "mama ")
        this.tokens.push({ type: TokenType.IDENTIFIER, value: 'mama', line: this.line, column: startCol });
      }
      return;
    }

    // Plain identifier
    this.tokens.push({ type: TokenType.IDENTIFIER, value: word, line: this.line, column: startCol });
  }

  private readPunctuation(): void {
    const startCol = this.column;
    const ch = this.advance();

    const emit = (type: TokenType, value: string) =>
      this.tokens.push({ type, value, line: this.line, column: startCol });

    switch (ch) {
      case '(': emit(TokenType.LPAREN,    '('); break;
      case ')': emit(TokenType.RPAREN,    ')'); break;
      case '{': emit(TokenType.LBRACE,    '{'); break;
      case '}': emit(TokenType.RBRACE,    '}'); break;
      case '[': emit(TokenType.LBRACKET,  '['); break;
      case ']': emit(TokenType.RBRACKET,  ']'); break;
      case ',': emit(TokenType.COMMA,     ','); break;
      case ';': emit(TokenType.SEMICOLON, ';'); break;
      case ':': emit(TokenType.COLON,     ':'); break;
      case '.': emit(TokenType.DOT,       '.'); break;
      case '%': emit(TokenType.PERCENT,   '%'); break;

      case '+':
        if (this.match('+'))      emit(TokenType.PLUS_PLUS, '++');
        else if (this.match('=')) emit(TokenType.PLUS_EQ,   '+=');
        else                      emit(TokenType.PLUS,       '+');
        break;

      case '-':
        if (this.match('-'))      emit(TokenType.MINUS_MINUS, '--');
        else if (this.match('=')) emit(TokenType.MINUS_EQ,   '-=');
        else                      emit(TokenType.MINUS,       '-');
        break;

      case '*': emit(TokenType.STAR,  '*'); break;

      case '/':
        // Block comments /* … */
        if (this.match('*')) {
          while (!this.isEnd() && !(this.peek() === '*' && this.peekNext() === '/')) {
            if (this.advance() === '\n') { this.line++; this.column = 1; }
          }
          if (!this.isEnd()) { this.advance(); this.advance(); } // consume */
        } else {
          emit(TokenType.SLASH, '/');
        }
        break;

      case '=':
        if (this.match('=')) {
          if (this.match('=')) emit(TokenType.EQ_EQ_EQ, '===');
          else                 emit(TokenType.EQ_EQ,    '==');
        } else {
          emit(TokenType.EQ, '=');
        }
        break;

      case '!':
        if (this.match('=')) {
          if (this.match('=')) emit(TokenType.BANG_EQ_EQ, '!==');
          else                 emit(TokenType.BANG_EQ,    '!=');
        } else {
          emit(TokenType.BANG, '!');
        }
        break;

      case '<':
        if (this.match('=')) emit(TokenType.LT_EQ, '<=');
        else emit(TokenType.LT, '<');
        break;

      case '>':
        if (this.match('=')) emit(TokenType.GT_EQ, '>=');
        else emit(TokenType.GT, '>');
        break;

      case '&':
        if (this.match('&')) emit(TokenType.AND, '&&');
        else throw new LexError(`Unexpected character '&'`, this.line, startCol);
        break;

      case '|':
        if (this.match('|')) emit(TokenType.OR, '||');
        else throw new LexError(`Unexpected character '|'`, this.line, startCol);
        break;

      default:
        throw new LexError(`Unexpected character '${ch}'`, this.line, startCol);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private peek(): string     { return this.source[this.pos] ?? ''; }
  private peekNext(): string { return this.source[this.pos + 1] ?? ''; }
  private isEnd(): boolean   { return this.pos >= this.source.length; }

  private advance(): string {
    const ch = this.source[this.pos++];
    this.column++;
    return ch;
  }

  private match(expected: string): boolean {
    if (this.isEnd() || this.source[this.pos] !== expected) return false;
    this.advance();
    return true;
  }

  private skipSpaces(): void {
    while (!this.isEnd() && (this.peek() === ' ' || this.peek() === '\t')) this.advance();
  }

  private makeToken(type: TokenType, value: string): Token {
    return { type, value, line: this.line, column: this.column };
  }

  private isDigit(ch: string): boolean     { return ch >= '0' && ch <= '9'; }
  private isAlpha(ch: string): boolean     { return /[a-zA-Z_$]/.test(ch); }
  private isAlphaNumeric(ch: string): boolean { return /[a-zA-Z0-9_$]/.test(ch); }
}

// ── Convenience export ────────────────────────────────────────────────────────

/** Tokenise MamaLang source and return the token array. */
export function tokenize(source: string): Token[] {
  return new Lexer(source).tokenize();
}
