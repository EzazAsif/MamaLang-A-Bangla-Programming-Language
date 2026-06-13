/**
 * Generator / Transpiler end-to-end tests
 *
 * These tests compile MamaLang source and check the generated JavaScript
 * contains the expected fragments.
 */
import { compile } from '../../src/index';

function js(src: string): string {
  return compile(src, { filename: 'test.mama' }).js;
}

describe('Generator', () => {
  describe('variable declarations', () => {
    it('mama dhori → let', () => {
      expect(js('mama dhori x = 10')).toContain('let x = 10;');
    });

    it('mama pakka → const', () => {
      expect(js('mama pakka pi = 3.14')).toContain('const pi = 3.14;');
    });
  });

  describe('print', () => {
    it('mama bolo → console.log', () => {
      expect(js('mama bolo("hello")')).toContain('console.log("hello");');
    });

    it('mama bolo with variable', () => {
      const output = js('mama dhori x = 1\nmama bolo(x)');
      expect(output).toContain('console.log(x);');
    });
  });

  describe('conditionals', () => {
    it('mama jodi → if', () => {
      const output = js('mama jodi (x > 5) { mama bolo("big") }');
      expect(output).toContain('if (');
      expect(output).toContain('console.log("big");');
    });

    it('mama nahole → else', () => {
      const src = `mama jodi (x > 0) {
        mama bolo("pos")
      } mama nahole {
        mama bolo("neg")
      }`;
      const output = js(src);
      expect(output).toContain('} else {');
    });
  });

  describe('loops', () => {
    it('mama ghuro → for', () => {
      const src = 'mama ghuro (mama dhori i = 0; i < 10; i++) { mama bolo(i) }';
      const output = js(src);
      expect(output).toContain('for (');
      expect(output).toContain('let i = 0');
    });

    it('mama jotokkhon → while', () => {
      const src = 'mama jotokkhon (x < 100) { x += 1 }';
      const output = js(src);
      expect(output).toContain('while (');
    });
  });

  describe('functions', () => {
    it('mama kaj → function', () => {
      const src = 'mama kaj add(a, b) { mama ferot a + b }';
      const output = js(src);
      expect(output).toContain('function add(a, b)');
      expect(output).toContain('return');
    });

    it('async function when body contains mama opekkha', () => {
      const src = 'mama kaj fetchData() { mama opekkha getData() }';
      const output = js(src);
      expect(output).toContain('async function fetchData');
      expect(output).toContain('await getData()');
    });
  });

  describe('booleans & null', () => {
    it('mama shotto → true', () => {
      expect(js('mama dhori x = mama shotto')).toContain('= true;');
    });
    it('mama miththa → false', () => {
      expect(js('mama dhori x = mama miththa')).toContain('= false;');
    });
    it('mama khali → null', () => {
      expect(js('mama dhori x = mama khali')).toContain('= null;');
    });
  });

  describe('meme features', () => {
    it('mama hasi → 😂', () => {
      expect(js('mama hasi()')).toContain('console.log("😂");');
    });

    it('mama kanna → 😭', () => {
      expect(js('mama kanna()')).toContain('console.log("😭");');
    });

    it('mama ghum → setTimeout', () => {
      const output = js('mama ghum(5000)');
      expect(output).toContain('await new Promise(r => setTimeout(r, 5000))');
    });
  });

  describe('try-catch', () => {
    it('mama panic → try', () => {
      const src = `mama panic { riskyCall() } mama dhora(err) { mama bolo(err) }`;
      const output = js(src);
      expect(output).toContain('try {');
      expect(output).toContain('catch(err)');
    });
  });

  describe('runtime helpers', () => {
    it('mama.random() → __mama__.random()', () => {
      const output = js('mama dhori r = mama.random()');
      expect(output).toContain('__mama__.random()');
    });

    it('mama.time() → __mama__.time()', () => {
      const output = js('mama dhori t = mama.time()');
      expect(output).toContain('__mama__.time()');
    });
  });

  describe('complex programs', () => {
    it('fibonacci compiles without errors', () => {
      const src = `
mama kaj fib(n) {
  mama jodi (n <= 1) {
    mama ferot n
  }
  mama ferot fib(n - 1) + fib(n - 2)
}
mama bolo(fib(10))
      `;
      expect(() => js(src)).not.toThrow();
      const output = js(src);
      expect(output).toContain('function fib');
    });

    it('for loop counter compiles', () => {
      const src = `
mama dhori sum = 0
mama ghuro (mama dhori i = 0; i < 100; i++) {
  sum += i
}
mama bolo(sum)
      `;
      expect(() => js(src)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('throws CompileError for unknown token', () => {
      expect(() => js('@invalid')).toThrow();
    });

    it('throws CompileError for unclosed brace', () => {
      expect(() => js('mama jodi (mama shotto) {')).toThrow();
    });
  });
});
