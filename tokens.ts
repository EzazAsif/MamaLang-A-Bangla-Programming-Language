/**
 * MamaLang Token Types
 * Defines every token the lexer can produce.
 */

export enum TokenType {
  // ── Mama Keywords ──────────────────────────────────────────────
  MAMA_DHORI      = 'MAMA_DHORI',       // let
  MAMA_PAKKA      = 'MAMA_PAKKA',       // const
  MAMA_BOLO       = 'MAMA_BOLO',        // console.log
  MAMA_JODI       = 'MAMA_JODI',        // if
  MAMA_NAHOLE     = 'MAMA_NAHOLE',      // else
  MAMA_GHURO      = 'MAMA_GHURO',       // for
  MAMA_JOTOKKHON  = 'MAMA_JOTOKKHON',   // while
  MAMA_KAJ        = 'MAMA_KAJ',         // function
  MAMA_FEROT      = 'MAMA_FEROT',       // return
  MAMA_OPEKKHA    = 'MAMA_OPEKKHA',     // await
  MAMA_SHOTTO     = 'MAMA_SHOTTO',      // true
  MAMA_MITHTHA    = 'MAMA_MITHTHA',     // false
  MAMA_KHALI      = 'MAMA_KHALI',       // null
  MAMA_HASI       = 'MAMA_HASI',        // console.log("😂")
  MAMA_KANNA      = 'MAMA_KANNA',       // console.log("😭")
  MAMA_GHUM       = 'MAMA_GHUM',        // await new Promise sleep
  MAMA_PANIC      = 'MAMA_PANIC',       // try
  MAMA_DHORA      = 'MAMA_DHORA',       // catch

  // ── Literals ───────────────────────────────────────────────────
  NUMBER          = 'NUMBER',
  STRING          = 'STRING',
  IDENTIFIER      = 'IDENTIFIER',

  // ── Operators ──────────────────────────────────────────────────
  PLUS            = 'PLUS',
  MINUS           = 'MINUS',
  STAR            = 'STAR',
  SLASH           = 'SLASH',
  PERCENT         = 'PERCENT',
  PLUS_PLUS       = 'PLUS_PLUS',
  MINUS_MINUS     = 'MINUS_MINUS',
  PLUS_EQ         = 'PLUS_EQ',
  MINUS_EQ        = 'MINUS_EQ',
  EQ              = 'EQ',
  EQ_EQ           = 'EQ_EQ',
  BANG_EQ         = 'BANG_EQ',
  EQ_EQ_EQ        = 'EQ_EQ_EQ',
  BANG_EQ_EQ      = 'BANG_EQ_EQ',
  LT              = 'LT',
  GT              = 'GT',
  LT_EQ           = 'LT_EQ',
  GT_EQ           = 'GT_EQ',
  AND             = 'AND',
  OR              = 'OR',
  BANG            = 'BANG',
  DOT             = 'DOT',

  // ── Delimiters ─────────────────────────────────────────────────
  LPAREN          = 'LPAREN',
  RPAREN          = 'RPAREN',
  LBRACE          = 'LBRACE',
  RBRACE          = 'RBRACE',
  LBRACKET        = 'LBRACKET',
  RBRACKET        = 'RBRACKET',
  COMMA           = 'COMMA',
  SEMICOLON       = 'SEMICOLON',
  COLON           = 'COLON',

  // ── Special ────────────────────────────────────────────────────
  NEWLINE         = 'NEWLINE',
  EOF             = 'EOF',
  UNKNOWN         = 'UNKNOWN',
}

/** A single token produced by the lexer. */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/** Human-readable names for error messages. */
export const TOKEN_LABELS: Record<TokenType, string> = {
  [TokenType.MAMA_DHORI]:     'mama dhori (let)',
  [TokenType.MAMA_PAKKA]:     'mama pakka (const)',
  [TokenType.MAMA_BOLO]:      'mama bolo (console.log)',
  [TokenType.MAMA_JODI]:      'mama jodi (if)',
  [TokenType.MAMA_NAHOLE]:    'mama nahole (else)',
  [TokenType.MAMA_GHURO]:     'mama ghuro (for)',
  [TokenType.MAMA_JOTOKKHON]: 'mama jotokkhon (while)',
  [TokenType.MAMA_KAJ]:       'mama kaj (function)',
  [TokenType.MAMA_FEROT]:     'mama ferot (return)',
  [TokenType.MAMA_OPEKKHA]:   'mama opekkha (await)',
  [TokenType.MAMA_SHOTTO]:    'mama shotto (true)',
  [TokenType.MAMA_MITHTHA]:   'mama miththa (false)',
  [TokenType.MAMA_KHALI]:     'mama khali (null)',
  [TokenType.MAMA_HASI]:      'mama hasi() (😂)',
  [TokenType.MAMA_KANNA]:     'mama kanna() (😭)',
  [TokenType.MAMA_GHUM]:      'mama ghum (sleep)',
  [TokenType.MAMA_PANIC]:     'mama panic (try)',
  [TokenType.MAMA_DHORA]:     'mama dhora (catch)',
  [TokenType.NUMBER]:         'number',
  [TokenType.STRING]:         'string',
  [TokenType.IDENTIFIER]:     'identifier',
  [TokenType.PLUS]:           '+',
  [TokenType.MINUS]:          '-',
  [TokenType.STAR]:           '*',
  [TokenType.SLASH]:          '/',
  [TokenType.PERCENT]:        '%',
  [TokenType.PLUS_PLUS]:      '++',
  [TokenType.MINUS_MINUS]:    '--',
  [TokenType.PLUS_EQ]:        '+=',
  [TokenType.MINUS_EQ]:       '-=',
  [TokenType.EQ]:             '=',
  [TokenType.EQ_EQ]:          '==',
  [TokenType.BANG_EQ]:        '!=',
  [TokenType.EQ_EQ_EQ]:       '===',
  [TokenType.BANG_EQ_EQ]:     '!==',
  [TokenType.LT]:             '<',
  [TokenType.GT]:             '>',
  [TokenType.LT_EQ]:         '<=',
  [TokenType.GT_EQ]:         '>=',
  [TokenType.AND]:            '&&',
  [TokenType.OR]:             '||',
  [TokenType.BANG]:           '!',
  [TokenType.DOT]:            '.',
  [TokenType.LPAREN]:         '(',
  [TokenType.RPAREN]:         ')',
  [TokenType.LBRACE]:         '{',
  [TokenType.RBRACE]:         '}',
  [TokenType.LBRACKET]:       '[',
  [TokenType.RBRACKET]:       ']',
  [TokenType.COMMA]:          ',',
  [TokenType.SEMICOLON]:      ';',
  [TokenType.COLON]:          ':',
  [TokenType.NEWLINE]:        'newline',
  [TokenType.EOF]:            'end of file',
  [TokenType.UNKNOWN]:        'unknown character',
};
