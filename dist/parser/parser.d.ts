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
import { Token } from '../lexer/tokens';
import * as AST from '../ast/nodes';
export declare class ParseError extends Error {
    readonly line: number;
    readonly column: number;
    constructor(message: string, line: number, column: number);
}
export declare class Parser {
    private pos;
    /** Filtered token list (NEWLINEs kept but can be skipped contextually). */
    private readonly tokens;
    constructor(tokens: Token[]);
    parse(): AST.Program;
    private parseStatement;
    private parseVarDecl;
    private parseFuncDecl;
    private parseParamList;
    private parseReturn;
    private parseIf;
    private parseFor;
    /** VarDecl without consuming the terminator (used inside for-init). */
    private parseVarDeclInline;
    private parseWhile;
    private parseTryCatch;
    private parsePrint;
    private parseMeme;
    private parseSleep;
    private parseExpressionStatement;
    private parseBlock;
    private parseExpression;
    private parseAssignment;
    private parseOr;
    private parseAnd;
    private parseEquality;
    private parseComparison;
    private parseAddition;
    private parseMultiplication;
    private parseUnary;
    private parseUpdate;
    private parseCallMember;
    private parsePrimary;
    private parseArray;
    private parseObject;
    private parseArgList;
    private peek;
    private isEnd;
    private check;
    private consume;
    private expect;
    private skipNewlines;
    private checkStatementEnd;
    private consumeStatementEnd;
}
export declare function parse(tokens: Token[]): AST.Program;
//# sourceMappingURL=parser.d.ts.map