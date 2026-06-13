/**
 * MamaLang Parser
 *
 * Recursive-descent parser that consumes a Token[] and produces an AST.
 *
 * Grammar (informal):
 *   program        → statement* EOF
 *   statement      → varDecl | funcDecl | returnStmt | ifStmt
 *                  | forStmt | whileStmt | tryCatch | printStmt
 *                  | sleepStmt | memeStmt | exprStmt
 *   exprStmt       → expression NEWLINE | SEMICOLON
 *   expression     → assignment
 *   assignment     → ternary ( ('=' | '+=' | '-=') assignment )?
 *   ...etc.
 */

import { Token, TokenType } from '../lexer/tokens';
import * as AST from '../ast/nodes';

// ── Parse Error ───────────────────────────────────────────────────────────────

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
  ) {
    super(`[ParseError] Line ${line}:${column} – ${message}`);
    this.name = 'ParseError';
  }
}

// ── Parser ────────────────────────────────────────────────────────────────────

export class Parser {
  private pos = 0;
  /** Filtered token list (NEWLINEs kept but can be skipped contextually). */
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    // Remove leading/trailing newlines and duplicates for convenience, but
    // keep them in the stream so we can use them as statement terminators.
    this.tokens = tokens.filter(
      (t) => t.type !== TokenType.UNKNOWN,
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  parse(): AST.Program {
    const program: AST.Program = {
      type: 'Program',
      body: [],
      line: 1,
      column: 1,
    };
    this.skipNewlines();
    while (!this.isEnd()) {
      program.body.push(this.parseStatement());
      this.skipNewlines();
    }
    return program;
  }

  // ── Statements ─────────────────────────────────────────────────────────────

  private parseStatement(): AST.ASTNode {
    const t = this.peek();

    switch (t.type) {
      case TokenType.MAMA_DHORI:    return this.parseVarDecl('let');
      case TokenType.MAMA_PAKKA:    return this.parseVarDecl('const');
      case TokenType.MAMA_KAJ:      return this.parseFuncDecl();
      case TokenType.MAMA_FEROT:    return this.parseReturn();
      case TokenType.MAMA_JODI:     return this.parseIf();
      case TokenType.MAMA_GHURO:    return this.parseFor();
      case TokenType.MAMA_JOTOKKHON:return this.parseWhile();
      case TokenType.MAMA_PANIC:    return this.parseTryCatch();
      case TokenType.MAMA_BOLO:     return this.parsePrint();
      case TokenType.MAMA_HASI:     return this.parseMeme('😂');
      case TokenType.MAMA_KANNA:    return this.parseMeme('😭');
      case TokenType.MAMA_GHUM:     return this.parseSleep();
      default:                       return this.parseExpressionStatement();
    }
  }

  // mama dhori / mama pakka
  private parseVarDecl(kind: 'let' | 'const'): AST.VarDeclaration {
    const tok = this.consume(); // consume the mama dhori / mama pakka token
    const nameTok = this.expect(TokenType.IDENTIFIER, 'variable name');
    let init: AST.ASTNode | null = null;
    if (this.check(TokenType.EQ)) {
      this.consume(); // =
      init = this.parseExpression();
    }
    this.consumeStatementEnd();
    return { type: 'VarDeclaration', kind, name: nameTok.value, init, line: tok.line, column: tok.column };
  }

  // mama kaj name(params) { body }
  private parseFuncDecl(): AST.FunctionDeclaration {
    const tok = this.consume(); // mama kaj
    const nameTok = this.expect(TokenType.IDENTIFIER, 'function name');
    this.expect(TokenType.LPAREN, "'('");
    const params = this.parseParamList();
    this.expect(TokenType.RPAREN, "')'");
    this.skipNewlines();
    const body = this.parseBlock();
    return {
      type: 'FunctionDeclaration',
      name: nameTok.value,
      params,
      body,
      isAsync: false,
      line: tok.line,
      column: tok.column,
    };
  }

  private parseParamList(): string[] {
    const params: string[] = [];
    while (!this.check(TokenType.RPAREN) && !this.isEnd()) {
      const p = this.expect(TokenType.IDENTIFIER, 'parameter name');
      params.push(p.value);
      if (!this.check(TokenType.RPAREN)) this.expect(TokenType.COMMA, "','");
    }
    return params;
  }

  // mama ferot expr
  private parseReturn(): AST.ReturnStatement {
    const tok = this.consume(); // mama ferot
    let argument: AST.ASTNode | null = null;
    if (!this.checkStatementEnd()) {
      argument = this.parseExpression();
    }
    this.consumeStatementEnd();
    return { type: 'ReturnStatement', argument, line: tok.line, column: tok.column };
  }

  // mama jodi (test) { ... } mama nahole { ... }
  private parseIf(): AST.IfStatement {
    const tok = this.consume(); // mama jodi
    this.expect(TokenType.LPAREN, "'('");
    const test = this.parseExpression();
    this.expect(TokenType.RPAREN, "')'");
    this.skipNewlines();
    const consequent = this.parseBlock();
    let alternate: AST.BlockStatement | AST.IfStatement | null = null;
    // Check for optional mama nahole
    this.skipNewlines();
    if (this.check(TokenType.MAMA_NAHOLE)) {
      this.consume(); // mama nahole
      this.skipNewlines();
      if (this.check(TokenType.MAMA_JODI)) {
        alternate = this.parseIf(); // else-if chain
      } else {
        alternate = this.parseBlock();
      }
    }
    return { type: 'IfStatement', test, consequent, alternate, line: tok.line, column: tok.column };
  }

  // mama ghuro (init; test; update) { body }
  private parseFor(): AST.ForStatement {
    const tok = this.consume(); // mama ghuro
    this.expect(TokenType.LPAREN, "'('");

    let init: AST.ASTNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      if (this.check(TokenType.MAMA_DHORI)) init = this.parseVarDeclInline('let');
      else if (this.check(TokenType.MAMA_PAKKA)) init = this.parseVarDeclInline('const');
      else init = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON, "';'");

    let test: AST.ASTNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) test = this.parseExpression();
    this.expect(TokenType.SEMICOLON, "';'");

    let update: AST.ASTNode | null = null;
    if (!this.check(TokenType.RPAREN)) update = this.parseExpression();
    this.expect(TokenType.RPAREN, "')'");
    this.skipNewlines();
    const body = this.parseBlock();

    return { type: 'ForStatement', init, test, update, body, line: tok.line, column: tok.column };
  }

  /** VarDecl without consuming the terminator (used inside for-init). */
  private parseVarDeclInline(kind: 'let' | 'const'): AST.VarDeclaration {
    const tok = this.consume();
    const nameTok = this.expect(TokenType.IDENTIFIER, 'variable name');
    let init: AST.ASTNode | null = null;
    if (this.check(TokenType.EQ)) {
      this.consume();
      init = this.parseExpression();
    }
    return { type: 'VarDeclaration', kind, name: nameTok.value, init, line: tok.line, column: tok.column };
  }

  // mama jotokkhon (test) { body }
  private parseWhile(): AST.WhileStatement {
    const tok = this.consume();
    this.expect(TokenType.LPAREN, "'('");
    const test = this.parseExpression();
    this.expect(TokenType.RPAREN, "')'");
    this.skipNewlines();
    const body = this.parseBlock();
    return { type: 'WhileStatement', test, body, line: tok.line, column: tok.column };
  }

  // mama panic { ... } mama dhora(err) { ... }
  private parseTryCatch(): AST.TryCatchStatement {
    const tok = this.consume(); // mama panic
    this.skipNewlines();
    const tryBlock = this.parseBlock();
    let catchParam: string | null = null;
    let catchBlock: AST.BlockStatement | null = null;
    this.skipNewlines();
    if (this.check(TokenType.MAMA_DHORA)) {
      this.consume(); // mama dhora
      if (this.check(TokenType.LPAREN)) {
        this.consume();
        catchParam = this.expect(TokenType.IDENTIFIER, 'catch parameter').value;
        this.expect(TokenType.RPAREN, "')'");
      }
      this.skipNewlines();
      catchBlock = this.parseBlock();
    }
    return { type: 'TryCatchStatement', tryBlock, catchParam, catchBlock, line: tok.line, column: tok.column };
  }

  // mama bolo(args...)
  private parsePrint(): AST.PrintStatement {
    const tok = this.consume(); // mama bolo
    this.expect(TokenType.LPAREN, "'('");
    const args = this.parseArgList();
    this.expect(TokenType.RPAREN, "')'");
    this.consumeStatementEnd();
    return { type: 'PrintStatement', args, line: tok.line, column: tok.column };
  }

  // mama hasi() / mama kanna()
  private parseMeme(emoji: '😂' | '😭'): AST.MemeStatement {
    const tok = this.consume();
    if (this.check(TokenType.LPAREN)) {
      this.consume();
      this.expect(TokenType.RPAREN, "')'");
    }
    this.consumeStatementEnd();
    return { type: 'MemeStatement', emoji, line: tok.line, column: tok.column };
  }

  // mama ghum(ms)
  private parseSleep(): AST.SleepStatement {
    const tok = this.consume(); // mama ghum
    this.expect(TokenType.LPAREN, "'('");
    const ms = this.parseExpression();
    this.expect(TokenType.RPAREN, "')'");
    this.consumeStatementEnd();
    return { type: 'SleepStatement', ms, line: tok.line, column: tok.column };
  }

  private parseExpressionStatement(): AST.ExpressionStatement {
    const tok = this.peek();
    const expr = this.parseExpression();
    this.consumeStatementEnd();
    return { type: 'ExpressionStatement', expression: expr, line: tok.line, column: tok.column };
  }

  // ── Block ──────────────────────────────────────────────────────────────────

  private parseBlock(): AST.BlockStatement {
    const tok = this.expect(TokenType.LBRACE, "'{'");
    this.skipNewlines();
    const body: AST.ASTNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isEnd()) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    this.expect(TokenType.RBRACE, "'}'");
    return { type: 'BlockStatement', body, line: tok.line, column: tok.column };
  }

  // ── Expressions ────────────────────────────────────────────────────────────

  private parseExpression(): AST.ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): AST.ASTNode {
    const left = this.parseOr();
    const t = this.peek();
    if (
      t.type === TokenType.EQ ||
      t.type === TokenType.PLUS_EQ ||
      t.type === TokenType.MINUS_EQ
    ) {
      this.consume();
      const right = this.parseAssignment();
      return {
        type: 'AssignmentExpression',
        operator: t.value,
        left,
        right,
        line: t.line,
        column: t.column,
      };
    }
    return left;
  }

  private parseOr(): AST.ASTNode {
    let left = this.parseAnd();
    while (this.check(TokenType.OR)) {
      const op = this.consume();
      const right = this.parseAnd();
      left = { type: 'BinaryExpression', operator: '||', left, right, line: op.line, column: op.column };
    }
    return left;
  }

  private parseAnd(): AST.ASTNode {
    let left = this.parseEquality();
    while (this.check(TokenType.AND)) {
      const op = this.consume();
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator: '&&', left, right, line: op.line, column: op.column };
    }
    return left;
  }

  private parseEquality(): AST.ASTNode {
    let left = this.parseComparison();
    while (
      this.check(TokenType.EQ_EQ) ||
      this.check(TokenType.BANG_EQ) ||
      this.check(TokenType.EQ_EQ_EQ) ||
      this.check(TokenType.BANG_EQ_EQ)
    ) {
      const op = this.consume();
      const right = this.parseComparison();
      left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
    }
    return left;
  }

  private parseComparison(): AST.ASTNode {
    let left = this.parseAddition();
    while (
      this.check(TokenType.LT) ||
      this.check(TokenType.GT) ||
      this.check(TokenType.LT_EQ) ||
      this.check(TokenType.GT_EQ)
    ) {
      const op = this.consume();
      const right = this.parseAddition();
      left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
    }
    return left;
  }

  private parseAddition(): AST.ASTNode {
    let left = this.parseMultiplication();
    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      const op = this.consume();
      const right = this.parseMultiplication();
      left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
    }
    return left;
  }

  private parseMultiplication(): AST.ASTNode {
    let left = this.parseUnary();
    while (this.check(TokenType.STAR) || this.check(TokenType.SLASH) || this.check(TokenType.PERCENT)) {
      const op = this.consume();
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
    }
    return left;
  }

  private parseUnary(): AST.ASTNode {
    if (this.check(TokenType.BANG)) {
      const op = this.consume();
      return { type: 'UnaryExpression', operator: '!', operand: this.parseUnary(), prefix: true, line: op.line, column: op.column };
    }
    if (this.check(TokenType.MINUS)) {
      const op = this.consume();
      return { type: 'UnaryExpression', operator: '-', operand: this.parseUnary(), prefix: true, line: op.line, column: op.column };
    }
    if (this.check(TokenType.MAMA_OPEKKHA)) {
      const op = this.consume();
      return { type: 'AwaitExpression', argument: this.parseUnary(), line: op.line, column: op.column };
    }
    return this.parseUpdate();
  }

  private parseUpdate(): AST.ASTNode {
    // Prefix ++ / --
    if (this.check(TokenType.PLUS_PLUS) || this.check(TokenType.MINUS_MINUS)) {
      const op = this.consume();
      const arg = this.parseCallMember();
      return { type: 'UpdateExpression', operator: op.value as '++' | '--', argument: arg, prefix: true, line: op.line, column: op.column };
    }
    let expr = this.parseCallMember();
    // Postfix ++ / --
    if (this.check(TokenType.PLUS_PLUS) || this.check(TokenType.MINUS_MINUS)) {
      const op = this.consume();
      return { type: 'UpdateExpression', operator: op.value as '++' | '--', argument: expr, prefix: false, line: op.line, column: op.column };
    }
    return expr;
  }

  private parseCallMember(): AST.ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.check(TokenType.LPAREN)) {
        this.consume();
        const args = this.parseArgList();
        const closeParen = this.expect(TokenType.RPAREN, "')'");
        expr = { type: 'CallExpression', callee: expr, args, line: closeParen.line, column: closeParen.column };
      } else if (this.check(TokenType.DOT)) {
        const dot = this.consume();
        const prop = this.expect(TokenType.IDENTIFIER, 'property name');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: { type: 'Identifier', name: prop.value, line: prop.line, column: prop.column },
          computed: false,
          line: dot.line,
          column: dot.column,
        };
      } else if (this.check(TokenType.LBRACKET)) {
        const bracket = this.consume();
        const prop = this.parseExpression();
        this.expect(TokenType.RBRACKET, "']'");
        expr = { type: 'MemberExpression', object: expr, property: prop, computed: true, line: bracket.line, column: bracket.column };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): AST.ASTNode {
    const t = this.peek();

    // Runtime helpers: mama.random() etc.
    if (t.type === TokenType.IDENTIFIER && t.value === 'mama') {
      this.consume();
      this.expect(TokenType.DOT, "'.'");
      const method = this.expect(TokenType.IDENTIFIER, 'runtime method name');
      return {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: '__mama__', line: t.line, column: t.column },
        property: { type: 'Identifier', name: method.value, line: method.line, column: method.column },
        computed: false,
        line: t.line,
        column: t.column,
      };
    }

    if (t.type === TokenType.NUMBER) {
      this.consume();
      return { type: 'NumberLiteral', value: parseFloat(t.value), raw: t.value, line: t.line, column: t.column };
    }

    if (t.type === TokenType.STRING) {
      this.consume();
      return { type: 'StringLiteral', value: t.value, raw: t.value, line: t.line, column: t.column };
    }

    if (t.type === TokenType.MAMA_SHOTTO) {
      this.consume();
      return { type: 'BooleanLiteral', value: true, line: t.line, column: t.column };
    }

    if (t.type === TokenType.MAMA_MITHTHA) {
      this.consume();
      return { type: 'BooleanLiteral', value: false, line: t.line, column: t.column };
    }

    if (t.type === TokenType.MAMA_KHALI) {
      this.consume();
      return { type: 'NullLiteral', line: t.line, column: t.column };
    }

    if (t.type === TokenType.IDENTIFIER) {
      this.consume();
      return { type: 'Identifier', name: t.value, line: t.line, column: t.column };
    }

    if (t.type === TokenType.LPAREN) {
      this.consume();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN, "')'");
      return expr;
    }

    if (t.type === TokenType.LBRACKET) {
      return this.parseArray();
    }

    if (t.type === TokenType.LBRACE) {
      return this.parseObject();
    }

    throw new ParseError(`Unexpected token '${t.value}' (${t.type})`, t.line, t.column);
  }

  private parseArray(): AST.ArrayExpression {
    const tok = this.consume(); // [
    const elements: AST.ASTNode[] = [];
    this.skipNewlines();
    while (!this.check(TokenType.RBRACKET) && !this.isEnd()) {
      elements.push(this.parseExpression());
      this.skipNewlines();
      if (!this.check(TokenType.RBRACKET)) this.expect(TokenType.COMMA, "','");
      this.skipNewlines();
    }
    this.expect(TokenType.RBRACKET, "']'");
    return { type: 'ArrayExpression', elements, line: tok.line, column: tok.column };
  }

  private parseObject(): AST.ObjectExpression {
    const tok = this.consume(); // {
    const properties: AST.Property[] = [];
    this.skipNewlines();
    while (!this.check(TokenType.RBRACE) && !this.isEnd()) {
      const keyTok = this.expect(TokenType.IDENTIFIER, 'property key');
      this.expect(TokenType.COLON, "':'");
      const value = this.parseExpression();
      properties.push({ type: 'Property', key: keyTok.value, value, line: keyTok.line, column: keyTok.column });
      this.skipNewlines();
      if (!this.check(TokenType.RBRACE)) { this.expect(TokenType.COMMA, "','"); this.skipNewlines(); }
    }
    this.expect(TokenType.RBRACE, "'}'");
    return { type: 'ObjectExpression', properties, line: tok.line, column: tok.column };
  }

  private parseArgList(): AST.ASTNode[] {
    const args: AST.ASTNode[] = [];
    this.skipNewlines();
    while (!this.check(TokenType.RPAREN) && !this.isEnd()) {
      args.push(this.parseExpression());
      this.skipNewlines();
      if (!this.check(TokenType.RPAREN)) this.expect(TokenType.COMMA, "','");
      this.skipNewlines();
    }
    return args;
  }

  // ── Token utilities ────────────────────────────────────────────────────────

  private peek(): Token { return this.tokens[this.pos] ?? { type: TokenType.EOF, value: '', line: 0, column: 0 }; }
  private isEnd(): boolean { return this.peek().type === TokenType.EOF; }
  private check(type: TokenType): boolean { return this.peek().type === type; }

  private consume(): Token {
    const t = this.tokens[this.pos];
    if (t) this.pos++;
    return t ?? { type: TokenType.EOF, value: '', line: 0, column: 0 };
  }

  private expect(type: TokenType, label: string): Token {
    if (this.peek().type !== type) {
      const t = this.peek();
      throw new ParseError(`Expected ${label} but got '${t.value}'`, t.line, t.column);
    }
    return this.consume();
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) this.consume();
  }

  private checkStatementEnd(): boolean {
    return this.check(TokenType.NEWLINE) || this.check(TokenType.SEMICOLON) || this.check(TokenType.RBRACE) || this.isEnd();
  }

  private consumeStatementEnd(): void {
    if (this.check(TokenType.SEMICOLON)) this.consume();
    else if (this.check(TokenType.NEWLINE)) this.consume();
    // else: implicit end (e.g. before '}' or EOF)
  }
}

// ── Convenience export ────────────────────────────────────────────────────────

export function parse(tokens: Token[]): AST.Program {
  return new Parser(tokens).parse();
}
