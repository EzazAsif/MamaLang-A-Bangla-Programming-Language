"use strict";
/**
 * MamaLang Token Types
 * Defines every token the lexer can produce.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_LABELS = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // ── Mama Keywords ──────────────────────────────────────────────
    TokenType["MAMA_DHORI"] = "MAMA_DHORI";
    TokenType["MAMA_PAKKA"] = "MAMA_PAKKA";
    TokenType["MAMA_BOLO"] = "MAMA_BOLO";
    TokenType["MAMA_JODI"] = "MAMA_JODI";
    TokenType["MAMA_NAHOLE"] = "MAMA_NAHOLE";
    TokenType["MAMA_GHURO"] = "MAMA_GHURO";
    TokenType["MAMA_JOTOKKHON"] = "MAMA_JOTOKKHON";
    TokenType["MAMA_KAJ"] = "MAMA_KAJ";
    TokenType["MAMA_FEROT"] = "MAMA_FEROT";
    TokenType["MAMA_OPEKKHA"] = "MAMA_OPEKKHA";
    TokenType["MAMA_SHOTTO"] = "MAMA_SHOTTO";
    TokenType["MAMA_MITHTHA"] = "MAMA_MITHTHA";
    TokenType["MAMA_KHALI"] = "MAMA_KHALI";
    TokenType["MAMA_HASI"] = "MAMA_HASI";
    TokenType["MAMA_KANNA"] = "MAMA_KANNA";
    TokenType["MAMA_GHUM"] = "MAMA_GHUM";
    TokenType["MAMA_PANIC"] = "MAMA_PANIC";
    TokenType["MAMA_DHORA"] = "MAMA_DHORA";
    // ── Literals ───────────────────────────────────────────────────
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    // ── Operators ──────────────────────────────────────────────────
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["STAR"] = "STAR";
    TokenType["SLASH"] = "SLASH";
    TokenType["PERCENT"] = "PERCENT";
    TokenType["PLUS_PLUS"] = "PLUS_PLUS";
    TokenType["MINUS_MINUS"] = "MINUS_MINUS";
    TokenType["PLUS_EQ"] = "PLUS_EQ";
    TokenType["MINUS_EQ"] = "MINUS_EQ";
    TokenType["EQ"] = "EQ";
    TokenType["EQ_EQ"] = "EQ_EQ";
    TokenType["BANG_EQ"] = "BANG_EQ";
    TokenType["EQ_EQ_EQ"] = "EQ_EQ_EQ";
    TokenType["BANG_EQ_EQ"] = "BANG_EQ_EQ";
    TokenType["LT"] = "LT";
    TokenType["GT"] = "GT";
    TokenType["LT_EQ"] = "LT_EQ";
    TokenType["GT_EQ"] = "GT_EQ";
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["BANG"] = "BANG";
    TokenType["DOT"] = "DOT";
    // ── Delimiters ─────────────────────────────────────────────────
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["LBRACKET"] = "LBRACKET";
    TokenType["RBRACKET"] = "RBRACKET";
    TokenType["COMMA"] = "COMMA";
    TokenType["SEMICOLON"] = "SEMICOLON";
    TokenType["COLON"] = "COLON";
    // ── Special ────────────────────────────────────────────────────
    TokenType["NEWLINE"] = "NEWLINE";
    TokenType["EOF"] = "EOF";
    TokenType["UNKNOWN"] = "UNKNOWN";
})(TokenType || (exports.TokenType = TokenType = {}));
/** Human-readable names for error messages. */
exports.TOKEN_LABELS = {
    [TokenType.MAMA_DHORI]: 'mama dhori (let)',
    [TokenType.MAMA_PAKKA]: 'mama pakka (const)',
    [TokenType.MAMA_BOLO]: 'mama bolo (console.log)',
    [TokenType.MAMA_JODI]: 'mama jodi (if)',
    [TokenType.MAMA_NAHOLE]: 'mama nahole (else)',
    [TokenType.MAMA_GHURO]: 'mama ghuro (for)',
    [TokenType.MAMA_JOTOKKHON]: 'mama jotokkhon (while)',
    [TokenType.MAMA_KAJ]: 'mama kaj (function)',
    [TokenType.MAMA_FEROT]: 'mama ferot (return)',
    [TokenType.MAMA_OPEKKHA]: 'mama opekkha (await)',
    [TokenType.MAMA_SHOTTO]: 'mama shotto (true)',
    [TokenType.MAMA_MITHTHA]: 'mama miththa (false)',
    [TokenType.MAMA_KHALI]: 'mama khali (null)',
    [TokenType.MAMA_HASI]: 'mama hasi() (😂)',
    [TokenType.MAMA_KANNA]: 'mama kanna() (😭)',
    [TokenType.MAMA_GHUM]: 'mama ghum (sleep)',
    [TokenType.MAMA_PANIC]: 'mama panic (try)',
    [TokenType.MAMA_DHORA]: 'mama dhora (catch)',
    [TokenType.NUMBER]: 'number',
    [TokenType.STRING]: 'string',
    [TokenType.IDENTIFIER]: 'identifier',
    [TokenType.PLUS]: '+',
    [TokenType.MINUS]: '-',
    [TokenType.STAR]: '*',
    [TokenType.SLASH]: '/',
    [TokenType.PERCENT]: '%',
    [TokenType.PLUS_PLUS]: '++',
    [TokenType.MINUS_MINUS]: '--',
    [TokenType.PLUS_EQ]: '+=',
    [TokenType.MINUS_EQ]: '-=',
    [TokenType.EQ]: '=',
    [TokenType.EQ_EQ]: '==',
    [TokenType.BANG_EQ]: '!=',
    [TokenType.EQ_EQ_EQ]: '===',
    [TokenType.BANG_EQ_EQ]: '!==',
    [TokenType.LT]: '<',
    [TokenType.GT]: '>',
    [TokenType.LT_EQ]: '<=',
    [TokenType.GT_EQ]: '>=',
    [TokenType.AND]: '&&',
    [TokenType.OR]: '||',
    [TokenType.BANG]: '!',
    [TokenType.DOT]: '.',
    [TokenType.LPAREN]: '(',
    [TokenType.RPAREN]: ')',
    [TokenType.LBRACE]: '{',
    [TokenType.RBRACE]: '}',
    [TokenType.LBRACKET]: '[',
    [TokenType.RBRACKET]: ']',
    [TokenType.COMMA]: ',',
    [TokenType.SEMICOLON]: ';',
    [TokenType.COLON]: ':',
    [TokenType.NEWLINE]: 'newline',
    [TokenType.EOF]: 'end of file',
    [TokenType.UNKNOWN]: 'unknown character',
};
//# sourceMappingURL=tokens.js.map