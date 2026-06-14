"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.ParseError = void 0;
exports.parse = parse;
const tokens_1 = require("../lexer/tokens");
// ── Parse Error ───────────────────────────────────────────────────────────────
class ParseError extends Error {
    constructor(message, line, column) {
        super(`[ParseError] Line ${line}:${column} – ${message}`);
        this.line = line;
        this.column = column;
        this.name = 'ParseError';
    }
}
exports.ParseError = ParseError;
// ── Parser ────────────────────────────────────────────────────────────────────
class Parser {
    constructor(tokens) {
        this.pos = 0;
        // Remove leading/trailing newlines and duplicates for convenience, but
        // keep them in the stream so we can use them as statement terminators.
        this.tokens = tokens.filter((t) => t.type !== tokens_1.TokenType.UNKNOWN);
    }
    // ── Public API ─────────────────────────────────────────────────────────────
    parse() {
        const program = {
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
    parseStatement() {
        const t = this.peek();
        switch (t.type) {
            case tokens_1.TokenType.MAMA_DHORI: return this.parseVarDecl('let');
            case tokens_1.TokenType.MAMA_PAKKA: return this.parseVarDecl('const');
            case tokens_1.TokenType.MAMA_KAJ: return this.parseFuncDecl();
            case tokens_1.TokenType.MAMA_FEROT: return this.parseReturn();
            case tokens_1.TokenType.MAMA_JODI: return this.parseIf();
            case tokens_1.TokenType.MAMA_GHURO: return this.parseFor();
            case tokens_1.TokenType.MAMA_JOTOKKHON: return this.parseWhile();
            case tokens_1.TokenType.MAMA_PANIC: return this.parseTryCatch();
            case tokens_1.TokenType.MAMA_BOLO: return this.parsePrint();
            case tokens_1.TokenType.MAMA_HASI: return this.parseMeme('😂');
            case tokens_1.TokenType.MAMA_KANNA: return this.parseMeme('😭');
            case tokens_1.TokenType.MAMA_GHUM: return this.parseSleep();
            default: return this.parseExpressionStatement();
        }
    }
    // mama dhori / mama pakka
    parseVarDecl(kind) {
        const tok = this.consume(); // consume the mama dhori / mama pakka token
        const nameTok = this.expect(tokens_1.TokenType.IDENTIFIER, 'variable name');
        let init = null;
        if (this.check(tokens_1.TokenType.EQ)) {
            this.consume(); // =
            init = this.parseExpression();
        }
        this.consumeStatementEnd();
        return { type: 'VarDeclaration', kind, name: nameTok.value, init, line: tok.line, column: tok.column };
    }
    // mama kaj name(params) { body }
    parseFuncDecl() {
        const tok = this.consume(); // mama kaj
        const nameTok = this.expect(tokens_1.TokenType.IDENTIFIER, 'function name');
        this.expect(tokens_1.TokenType.LPAREN, "'('");
        const params = this.parseParamList();
        this.expect(tokens_1.TokenType.RPAREN, "')'");
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
    parseParamList() {
        const params = [];
        while (!this.check(tokens_1.TokenType.RPAREN) && !this.isEnd()) {
            const p = this.expect(tokens_1.TokenType.IDENTIFIER, 'parameter name');
            params.push(p.value);
            if (!this.check(tokens_1.TokenType.RPAREN))
                this.expect(tokens_1.TokenType.COMMA, "','");
        }
        return params;
    }
    // mama ferot expr
    parseReturn() {
        const tok = this.consume(); // mama ferot
        let argument = null;
        if (!this.checkStatementEnd()) {
            argument = this.parseExpression();
        }
        this.consumeStatementEnd();
        return { type: 'ReturnStatement', argument, line: tok.line, column: tok.column };
    }
    // mama jodi (test) { ... } mama nahole { ... }
    parseIf() {
        const tok = this.consume(); // mama jodi
        this.expect(tokens_1.TokenType.LPAREN, "'('");
        const test = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "')'");
        this.skipNewlines();
        const consequent = this.parseBlock();
        let alternate = null;
        // Check for optional mama nahole
        this.skipNewlines();
        if (this.check(tokens_1.TokenType.MAMA_NAHOLE)) {
            this.consume(); // mama nahole
            this.skipNewlines();
            if (this.check(tokens_1.TokenType.MAMA_JODI)) {
                alternate = this.parseIf(); // else-if chain
            }
            else {
                alternate = this.parseBlock();
            }
        }
        return { type: 'IfStatement', test, consequent, alternate, line: tok.line, column: tok.column };
    }
    // mama ghuro (init; test; update) { body }
    parseFor() {
        const tok = this.consume(); // mama ghuro
        this.expect(tokens_1.TokenType.LPAREN, "'('");
        let init = null;
        if (!this.check(tokens_1.TokenType.SEMICOLON)) {
            if (this.check(tokens_1.TokenType.MAMA_DHORI))
                init = this.parseVarDeclInline('let');
            else if (this.check(tokens_1.TokenType.MAMA_PAKKA))
                init = this.parseVarDeclInline('const');
            else
                init = this.parseExpression();
        }
        this.expect(tokens_1.TokenType.SEMICOLON, "';'");
        let test = null;
        if (!this.check(tokens_1.TokenType.SEMICOLON))
            test = this.parseExpression();
        this.expect(tokens_1.TokenType.SEMICOLON, "';'");
        let update = null;
        if (!this.check(tokens_1.TokenType.RPAREN))
            update = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "')'");
        this.skipNewlines();
        const body = this.parseBlock();
        return { type: 'ForStatement', init, test, update, body, line: tok.line, column: tok.column };
    }
    /** VarDecl without consuming the terminator (used inside for-init). */
    parseVarDeclInline(kind) {
        const tok = this.consume();
        const nameTok = this.expect(tokens_1.TokenType.IDENTIFIER, 'variable name');
        let init = null;
        if (this.check(tokens_1.TokenType.EQ)) {
            this.consume();
            init = this.parseExpression();
        }
        return { type: 'VarDeclaration', kind, name: nameTok.value, init, line: tok.line, column: tok.column };
    }
    // mama jotokkhon (test) { body }
    parseWhile() {
        const tok = this.consume();
        this.expect(tokens_1.TokenType.LPAREN, "'('");
        const test = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "')'");
        this.skipNewlines();
        const body = this.parseBlock();
        return { type: 'WhileStatement', test, body, line: tok.line, column: tok.column };
    }
    // mama panic { ... } mama dhora(err) { ... }
    parseTryCatch() {
        const tok = this.consume(); // mama panic
        this.skipNewlines();
        const tryBlock = this.parseBlock();
        let catchParam = null;
        let catchBlock = null;
        this.skipNewlines();
        if (this.check(tokens_1.TokenType.MAMA_DHORA)) {
            this.consume(); // mama dhora
            if (this.check(tokens_1.TokenType.LPAREN)) {
                this.consume();
                catchParam = this.expect(tokens_1.TokenType.IDENTIFIER, 'catch parameter').value;
                this.expect(tokens_1.TokenType.RPAREN, "')'");
            }
            this.skipNewlines();
            catchBlock = this.parseBlock();
        }
        return { type: 'TryCatchStatement', tryBlock, catchParam, catchBlock, line: tok.line, column: tok.column };
    }
    // mama bolo(args...)
    parsePrint() {
        const tok = this.consume(); // mama bolo
        this.expect(tokens_1.TokenType.LPAREN, "'('");
        const args = this.parseArgList();
        this.expect(tokens_1.TokenType.RPAREN, "')'");
        this.consumeStatementEnd();
        return { type: 'PrintStatement', args, line: tok.line, column: tok.column };
    }
    // mama hasi() / mama kanna()
    parseMeme(emoji) {
        const tok = this.consume();
        if (this.check(tokens_1.TokenType.LPAREN)) {
            this.consume();
            this.expect(tokens_1.TokenType.RPAREN, "')'");
        }
        this.consumeStatementEnd();
        return { type: 'MemeStatement', emoji, line: tok.line, column: tok.column };
    }
    // mama ghum(ms)
    parseSleep() {
        const tok = this.consume(); // mama ghum
        this.expect(tokens_1.TokenType.LPAREN, "'('");
        const ms = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "')'");
        this.consumeStatementEnd();
        return { type: 'SleepStatement', ms, line: tok.line, column: tok.column };
    }
    parseExpressionStatement() {
        const tok = this.peek();
        const expr = this.parseExpression();
        this.consumeStatementEnd();
        return { type: 'ExpressionStatement', expression: expr, line: tok.line, column: tok.column };
    }
    // ── Block ──────────────────────────────────────────────────────────────────
    parseBlock() {
        const tok = this.expect(tokens_1.TokenType.LBRACE, "'{'");
        this.skipNewlines();
        const body = [];
        while (!this.check(tokens_1.TokenType.RBRACE) && !this.isEnd()) {
            body.push(this.parseStatement());
            this.skipNewlines();
        }
        this.expect(tokens_1.TokenType.RBRACE, "'}'");
        return { type: 'BlockStatement', body, line: tok.line, column: tok.column };
    }
    // ── Expressions ────────────────────────────────────────────────────────────
    parseExpression() {
        return this.parseAssignment();
    }
    parseAssignment() {
        const left = this.parseOr();
        const t = this.peek();
        if (t.type === tokens_1.TokenType.EQ ||
            t.type === tokens_1.TokenType.PLUS_EQ ||
            t.type === tokens_1.TokenType.MINUS_EQ) {
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
    parseOr() {
        let left = this.parseAnd();
        while (this.check(tokens_1.TokenType.OR)) {
            const op = this.consume();
            const right = this.parseAnd();
            left = { type: 'BinaryExpression', operator: '||', left, right, line: op.line, column: op.column };
        }
        return left;
    }
    parseAnd() {
        let left = this.parseEquality();
        while (this.check(tokens_1.TokenType.AND)) {
            const op = this.consume();
            const right = this.parseEquality();
            left = { type: 'BinaryExpression', operator: '&&', left, right, line: op.line, column: op.column };
        }
        return left;
    }
    parseEquality() {
        let left = this.parseComparison();
        while (this.check(tokens_1.TokenType.EQ_EQ) ||
            this.check(tokens_1.TokenType.BANG_EQ) ||
            this.check(tokens_1.TokenType.EQ_EQ_EQ) ||
            this.check(tokens_1.TokenType.BANG_EQ_EQ)) {
            const op = this.consume();
            const right = this.parseComparison();
            left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
        }
        return left;
    }
    parseComparison() {
        let left = this.parseAddition();
        while (this.check(tokens_1.TokenType.LT) ||
            this.check(tokens_1.TokenType.GT) ||
            this.check(tokens_1.TokenType.LT_EQ) ||
            this.check(tokens_1.TokenType.GT_EQ)) {
            const op = this.consume();
            const right = this.parseAddition();
            left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
        }
        return left;
    }
    parseAddition() {
        let left = this.parseMultiplication();
        while (this.check(tokens_1.TokenType.PLUS) || this.check(tokens_1.TokenType.MINUS)) {
            const op = this.consume();
            const right = this.parseMultiplication();
            left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
        }
        return left;
    }
    parseMultiplication() {
        let left = this.parseUnary();
        while (this.check(tokens_1.TokenType.STAR) || this.check(tokens_1.TokenType.SLASH) || this.check(tokens_1.TokenType.PERCENT)) {
            const op = this.consume();
            const right = this.parseUnary();
            left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
        }
        return left;
    }
    parseUnary() {
        if (this.check(tokens_1.TokenType.BANG)) {
            const op = this.consume();
            return { type: 'UnaryExpression', operator: '!', operand: this.parseUnary(), prefix: true, line: op.line, column: op.column };
        }
        if (this.check(tokens_1.TokenType.MINUS)) {
            const op = this.consume();
            return { type: 'UnaryExpression', operator: '-', operand: this.parseUnary(), prefix: true, line: op.line, column: op.column };
        }
        if (this.check(tokens_1.TokenType.MAMA_OPEKKHA)) {
            const op = this.consume();
            return { type: 'AwaitExpression', argument: this.parseUnary(), line: op.line, column: op.column };
        }
        return this.parseUpdate();
    }
    parseUpdate() {
        // Prefix ++ / --
        if (this.check(tokens_1.TokenType.PLUS_PLUS) || this.check(tokens_1.TokenType.MINUS_MINUS)) {
            const op = this.consume();
            const arg = this.parseCallMember();
            return { type: 'UpdateExpression', operator: op.value, argument: arg, prefix: true, line: op.line, column: op.column };
        }
        let expr = this.parseCallMember();
        // Postfix ++ / --
        if (this.check(tokens_1.TokenType.PLUS_PLUS) || this.check(tokens_1.TokenType.MINUS_MINUS)) {
            const op = this.consume();
            return { type: 'UpdateExpression', operator: op.value, argument: expr, prefix: false, line: op.line, column: op.column };
        }
        return expr;
    }
    parseCallMember() {
        let expr = this.parsePrimary();
        while (true) {
            if (this.check(tokens_1.TokenType.LPAREN)) {
                this.consume();
                const args = this.parseArgList();
                const closeParen = this.expect(tokens_1.TokenType.RPAREN, "')'");
                expr = { type: 'CallExpression', callee: expr, args, line: closeParen.line, column: closeParen.column };
            }
            else if (this.check(tokens_1.TokenType.DOT)) {
                const dot = this.consume();
                const prop = this.expect(tokens_1.TokenType.IDENTIFIER, 'property name');
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', name: prop.value, line: prop.line, column: prop.column },
                    computed: false,
                    line: dot.line,
                    column: dot.column,
                };
            }
            else if (this.check(tokens_1.TokenType.LBRACKET)) {
                const bracket = this.consume();
                const prop = this.parseExpression();
                this.expect(tokens_1.TokenType.RBRACKET, "']'");
                expr = { type: 'MemberExpression', object: expr, property: prop, computed: true, line: bracket.line, column: bracket.column };
            }
            else {
                break;
            }
        }
        return expr;
    }
    parsePrimary() {
        const t = this.peek();
        // Runtime helpers: mama.random() etc.
        if (t.type === tokens_1.TokenType.IDENTIFIER && t.value === 'mama') {
            this.consume();
            this.expect(tokens_1.TokenType.DOT, "'.'");
            const method = this.expect(tokens_1.TokenType.IDENTIFIER, 'runtime method name');
            return {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: '__mama__', line: t.line, column: t.column },
                property: { type: 'Identifier', name: method.value, line: method.line, column: method.column },
                computed: false,
                line: t.line,
                column: t.column,
            };
        }
        if (t.type === tokens_1.TokenType.NUMBER) {
            this.consume();
            return { type: 'NumberLiteral', value: parseFloat(t.value), raw: t.value, line: t.line, column: t.column };
        }
        if (t.type === tokens_1.TokenType.STRING) {
            this.consume();
            return { type: 'StringLiteral', value: t.value, raw: t.value, line: t.line, column: t.column };
        }
        if (t.type === tokens_1.TokenType.MAMA_SHOTTO) {
            this.consume();
            return { type: 'BooleanLiteral', value: true, line: t.line, column: t.column };
        }
        if (t.type === tokens_1.TokenType.MAMA_MITHTHA) {
            this.consume();
            return { type: 'BooleanLiteral', value: false, line: t.line, column: t.column };
        }
        if (t.type === tokens_1.TokenType.MAMA_KHALI) {
            this.consume();
            return { type: 'NullLiteral', line: t.line, column: t.column };
        }
        if (t.type === tokens_1.TokenType.IDENTIFIER) {
            this.consume();
            return { type: 'Identifier', name: t.value, line: t.line, column: t.column };
        }
        if (t.type === tokens_1.TokenType.LPAREN) {
            this.consume();
            const expr = this.parseExpression();
            this.expect(tokens_1.TokenType.RPAREN, "')'");
            return expr;
        }
        if (t.type === tokens_1.TokenType.LBRACKET) {
            return this.parseArray();
        }
        if (t.type === tokens_1.TokenType.LBRACE) {
            return this.parseObject();
        }
        throw new ParseError(`Unexpected token '${t.value}' (${t.type})`, t.line, t.column);
    }
    parseArray() {
        const tok = this.consume(); // [
        const elements = [];
        this.skipNewlines();
        while (!this.check(tokens_1.TokenType.RBRACKET) && !this.isEnd()) {
            elements.push(this.parseExpression());
            this.skipNewlines();
            if (!this.check(tokens_1.TokenType.RBRACKET))
                this.expect(tokens_1.TokenType.COMMA, "','");
            this.skipNewlines();
        }
        this.expect(tokens_1.TokenType.RBRACKET, "']'");
        return { type: 'ArrayExpression', elements, line: tok.line, column: tok.column };
    }
    parseObject() {
        const tok = this.consume(); // {
        const properties = [];
        this.skipNewlines();
        while (!this.check(tokens_1.TokenType.RBRACE) && !this.isEnd()) {
            const keyTok = this.expect(tokens_1.TokenType.IDENTIFIER, 'property key');
            this.expect(tokens_1.TokenType.COLON, "':'");
            const value = this.parseExpression();
            properties.push({ type: 'Property', key: keyTok.value, value, line: keyTok.line, column: keyTok.column });
            this.skipNewlines();
            if (!this.check(tokens_1.TokenType.RBRACE)) {
                this.expect(tokens_1.TokenType.COMMA, "','");
                this.skipNewlines();
            }
        }
        this.expect(tokens_1.TokenType.RBRACE, "'}'");
        return { type: 'ObjectExpression', properties, line: tok.line, column: tok.column };
    }
    parseArgList() {
        const args = [];
        this.skipNewlines();
        while (!this.check(tokens_1.TokenType.RPAREN) && !this.isEnd()) {
            args.push(this.parseExpression());
            this.skipNewlines();
            if (!this.check(tokens_1.TokenType.RPAREN))
                this.expect(tokens_1.TokenType.COMMA, "','");
            this.skipNewlines();
        }
        return args;
    }
    // ── Token utilities ────────────────────────────────────────────────────────
    peek() { return this.tokens[this.pos] ?? { type: tokens_1.TokenType.EOF, value: '', line: 0, column: 0 }; }
    isEnd() { return this.peek().type === tokens_1.TokenType.EOF; }
    check(type) { return this.peek().type === type; }
    consume() {
        const t = this.tokens[this.pos];
        if (t)
            this.pos++;
        return t ?? { type: tokens_1.TokenType.EOF, value: '', line: 0, column: 0 };
    }
    expect(type, label) {
        if (this.peek().type !== type) {
            const t = this.peek();
            throw new ParseError(`Expected ${label} but got '${t.value}'`, t.line, t.column);
        }
        return this.consume();
    }
    skipNewlines() {
        while (this.check(tokens_1.TokenType.NEWLINE))
            this.consume();
    }
    checkStatementEnd() {
        return this.check(tokens_1.TokenType.NEWLINE) || this.check(tokens_1.TokenType.SEMICOLON) || this.check(tokens_1.TokenType.RBRACE) || this.isEnd();
    }
    consumeStatementEnd() {
        if (this.check(tokens_1.TokenType.SEMICOLON))
            this.consume();
        else if (this.check(tokens_1.TokenType.NEWLINE))
            this.consume();
        // else: implicit end (e.g. before '}' or EOF)
    }
}
exports.Parser = Parser;
// ── Convenience export ────────────────────────────────────────────────────────
function parse(tokens) {
    return new Parser(tokens).parse();
}
//# sourceMappingURL=parser.js.map