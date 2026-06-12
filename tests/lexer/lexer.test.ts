/**
 * Lexer unit tests
 */
import { tokenize }  from '../../src/lexer/lexer';
import { TokenType } from '../../src/lexer/tokens';

describe('Lexer', () => {
  describe('mama keywords', () => {
    it('tokenizes mama dhori', () => {
      const tokens = tokenize('mama dhori x = 5');
      expect(tokens[0].type).toBe(TokenType.MAMA_DHORI);
    });

    it('tokenizes mama pakka', () => {
      const tokens = tokenize('mama pakka PI = 3.14');
      expect(tokens[0].type).toBe(TokenType.MAMA_PAKKA);
    });

    it('tokenizes mama bolo', () => {
      const tokens = tokenize('mama bolo("hi")');
      expect(tokens[0].type).toBe(TokenType.MAMA_BOLO);
    });

    it('tokenizes mama jodi', () => {
      const tokens = tokenize('mama jodi (x > 0) {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_JODI);
    });

    it('tokenizes mama nahole', () => {
      const tokens = tokenize('mama nahole {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_NAHOLE);
    });

    it('tokenizes mama ghuro', () => {
      const tokens = tokenize('mama ghuro (;;) {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_GHURO);
    });

    it('tokenizes mama jotokkhon', () => {
      const tokens = tokenize('mama jotokkhon (mama shotto) {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_JOTOKKHON);
    });

    it('tokenizes mama kaj', () => {
      const tokens = tokenize('mama kaj foo() {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_KAJ);
    });

    it('tokenizes mama ferot', () => {
      const tokens = tokenize('mama ferot 42');
      expect(tokens[0].type).toBe(TokenType.MAMA_FEROT);
    });

    it('tokenizes mama shotto', () => {
      const tokens = tokenize('mama shotto');
      expect(tokens[0].type).toBe(TokenType.MAMA_SHOTTO);
    });

    it('tokenizes mama miththa', () => {
      const tokens = tokenize('mama miththa');
      expect(tokens[0].type).toBe(TokenType.MAMA_MITHTHA);
    });

    it('tokenizes mama khali', () => {
      const tokens = tokenize('mama khali');
      expect(tokens[0].type).toBe(TokenType.MAMA_KHALI);
    });

    it('tokenizes mama hasi', () => {
      const tokens = tokenize('mama hasi()');
      expect(tokens[0].type).toBe(TokenType.MAMA_HASI);
    });

    it('tokenizes mama kanna', () => {
      const tokens = tokenize('mama kanna()');
      expect(tokens[0].type).toBe(TokenType.MAMA_KANNA);
    });

    it('tokenizes mama ghum', () => {
      const tokens = tokenize('mama ghum(1000)');
      expect(tokens[0].type).toBe(TokenType.MAMA_GHUM);
    });

    it('tokenizes mama panic', () => {
      const tokens = tokenize('mama panic {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_PANIC);
    });

    it('tokenizes mama dhora', () => {
      const tokens = tokenize('mama dhora(err) {}');
      expect(tokens[0].type).toBe(TokenType.MAMA_DHORA);
    });

    it('tokenizes mama opekkha', () => {
      const tokens = tokenize('mama opekkha foo()');
      expect(tokens[0].type).toBe(TokenType.MAMA_OPEKKHA);
    });
  });

  describe('literals', () => {
    it('tokenizes integers', () => {
      const [t] = tokenize('42');
      expect(t.type).toBe(TokenType.NUMBER);
      expect(t.value).toBe('42');
    });

    it('tokenizes floats', () => {
      const [t] = tokenize('3.14');
      expect(t.type).toBe(TokenType.NUMBER);
      expect(t.value).toBe('3.14');
    });

    it('tokenizes double-quoted strings', () => {
      const [t] = tokenize('"hello"');
      expect(t.type).toBe(TokenType.STRING);
      expect(t.value).toBe('"hello"');
    });

    it('tokenizes single-quoted strings', () => {
      const [t] = tokenize("'world'");
      expect(t.type).toBe(TokenType.STRING);
      expect(t.value).toBe("'world'");
    });

    it('handles escape sequences in strings', () => {
      const [t] = tokenize('"line1\\nline2"');
      expect(t.type).toBe(TokenType.STRING);
    });
  });

  describe('operators', () => {
    const cases: [string, TokenType][] = [
      ['+',   TokenType.PLUS],
      ['-',   TokenType.MINUS],
      ['*',   TokenType.STAR],
      ['/',   TokenType.SLASH],
      ['%',   TokenType.PERCENT],
      ['++',  TokenType.PLUS_PLUS],
      ['--',  TokenType.MINUS_MINUS],
      ['+=',  TokenType.PLUS_EQ],
      ['-=',  TokenType.MINUS_EQ],
      ['=',   TokenType.EQ],
      ['==',  TokenType.EQ_EQ],
      ['===', TokenType.EQ_EQ_EQ],
      ['!=',  TokenType.BANG_EQ],
      ['!==', TokenType.BANG_EQ_EQ],
      ['<',   TokenType.LT],
      ['>',   TokenType.GT],
      ['<=',  TokenType.LT_EQ],
      ['>=',  TokenType.GT_EQ],
      ['&&',  TokenType.AND],
      ['||',  TokenType.OR],
      ['!',   TokenType.BANG],
    ];

    cases.forEach(([src, expected]) => {
      it(`tokenizes '${src}'`, () => {
        const tokens = tokenize(src);
        expect(tokens[0].type).toBe(expected);
      });
    });
  });

  describe('comments', () => {
    it('ignores single-line comments', () => {
      const tokens = tokenize('// this is a comment\nmama dhori x = 1');
      expect(tokens[0].type).toBe(TokenType.NEWLINE);
      expect(tokens[1].type).toBe(TokenType.MAMA_DHORI);
    });

    it('ignores block comments', () => {
      const tokens = tokenize('/* block */ mama dhori x = 1');
      expect(tokens[0].type).toBe(TokenType.MAMA_DHORI);
    });
  });

  describe('error handling', () => {
    it('throws LexError on unterminated string', () => {
      expect(() => tokenize('"unterminated')).toThrow();
    });

    it('throws LexError on unexpected character', () => {
      expect(() => tokenize('@')).toThrow();
    });
  });

  describe('line / column tracking', () => {
    it('tracks line numbers', () => {
      const tokens = tokenize('mama dhori x = 1\nmama dhori y = 2');
      const secondDecl = tokens.find(t => t.type === TokenType.MAMA_DHORI && t.line === 2);
      expect(secondDecl).toBeDefined();
      expect(secondDecl?.line).toBe(2);
    });
  });
});
