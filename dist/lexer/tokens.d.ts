/**
 * MamaLang Token Types
 * Defines every token the lexer can produce.
 */
export declare enum TokenType {
    MAMA_DHORI = "MAMA_DHORI",// let
    MAMA_PAKKA = "MAMA_PAKKA",// const
    MAMA_BOLO = "MAMA_BOLO",// console.log
    MAMA_JODI = "MAMA_JODI",// if
    MAMA_NAHOLE = "MAMA_NAHOLE",// else
    MAMA_GHURO = "MAMA_GHURO",// for
    MAMA_JOTOKKHON = "MAMA_JOTOKKHON",// while
    MAMA_KAJ = "MAMA_KAJ",// function
    MAMA_FEROT = "MAMA_FEROT",// return
    MAMA_OPEKKHA = "MAMA_OPEKKHA",// await
    MAMA_SHOTTO = "MAMA_SHOTTO",// true
    MAMA_MITHTHA = "MAMA_MITHTHA",// false
    MAMA_KHALI = "MAMA_KHALI",// null
    MAMA_HASI = "MAMA_HASI",// console.log("😂")
    MAMA_KANNA = "MAMA_KANNA",// console.log("😭")
    MAMA_GHUM = "MAMA_GHUM",// await new Promise sleep
    MAMA_PANIC = "MAMA_PANIC",// try
    MAMA_DHORA = "MAMA_DHORA",// catch
    NUMBER = "NUMBER",
    STRING = "STRING",
    IDENTIFIER = "IDENTIFIER",
    PLUS = "PLUS",
    MINUS = "MINUS",
    STAR = "STAR",
    SLASH = "SLASH",
    PERCENT = "PERCENT",
    PLUS_PLUS = "PLUS_PLUS",
    MINUS_MINUS = "MINUS_MINUS",
    PLUS_EQ = "PLUS_EQ",
    MINUS_EQ = "MINUS_EQ",
    EQ = "EQ",
    EQ_EQ = "EQ_EQ",
    BANG_EQ = "BANG_EQ",
    EQ_EQ_EQ = "EQ_EQ_EQ",
    BANG_EQ_EQ = "BANG_EQ_EQ",
    LT = "LT",
    GT = "GT",
    LT_EQ = "LT_EQ",
    GT_EQ = "GT_EQ",
    AND = "AND",
    OR = "OR",
    BANG = "BANG",
    DOT = "DOT",
    LPAREN = "LPAREN",
    RPAREN = "RPAREN",
    LBRACE = "LBRACE",
    RBRACE = "RBRACE",
    LBRACKET = "LBRACKET",
    RBRACKET = "RBRACKET",
    COMMA = "COMMA",
    SEMICOLON = "SEMICOLON",
    COLON = "COLON",
    NEWLINE = "NEWLINE",
    EOF = "EOF",
    UNKNOWN = "UNKNOWN"
}
/** A single token produced by the lexer. */
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
/** Human-readable names for error messages. */
export declare const TOKEN_LABELS: Record<TokenType, string>;
//# sourceMappingURL=tokens.d.ts.map