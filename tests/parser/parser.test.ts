/**
 * Parser unit tests
 */
import { tokenize }  from '../../src/lexer/lexer';
import { parse }     from '../../src/parser/parser';

function parseSource(src: string) {
  return parse(tokenize(src));
}

describe('Parser', () => {
  describe('VarDeclaration', () => {
    it('parses mama dhori with initialiser', () => {
      const ast = parseSource('mama dhori x = 42');
      const node = ast.body[0] as any;
      expect(node.type).toBe('VarDeclaration');
      expect(node.kind).toBe('let');
      expect(node.name).toBe('x');
      expect(node.init.type).toBe('NumberLiteral');
      expect(node.init.value).toBe(42);
    });

    it('parses mama pakka with initialiser', () => {
      const ast = parseSource('mama pakka PI = 3.14');
      const node = ast.body[0] as any;
      expect(node.kind).toBe('const');
      expect(node.name).toBe('PI');
    });

    it('parses mama dhori without initialiser', () => {
      const ast = parseSource('mama dhori x');
      const node = ast.body[0] as any;
      expect(node.init).toBeNull();
    });
  });

  describe('FunctionDeclaration', () => {
    it('parses mama kaj with params', () => {
      const ast = parseSource('mama kaj add(a, b) { mama ferot a }');
      const node = ast.body[0] as any;
      expect(node.type).toBe('FunctionDeclaration');
      expect(node.name).toBe('add');
      expect(node.params).toEqual(['a', 'b']);
    });

    it('parses mama kaj with no params', () => {
      const ast = parseSource('mama kaj greet() {}');
      const node = ast.body[0] as any;
      expect(node.params).toEqual([]);
    });
  });

  describe('IfStatement', () => {
    it('parses mama jodi', () => {
      const ast = parseSource('mama jodi (x > 0) { mama bolo(x) }');
      const node = ast.body[0] as any;
      expect(node.type).toBe('IfStatement');
      expect(node.test.type).toBe('BinaryExpression');
      expect(node.alternate).toBeNull();
    });

    it('parses mama jodi ... mama nahole', () => {
      const src = `
        mama jodi (x > 0) {
          mama bolo("pos")
        } mama nahole {
          mama bolo("neg")
        }
      `;
      const ast = parseSource(src);
      const node = ast.body[0] as any;
      expect(node.type).toBe('IfStatement');
      expect(node.alternate).not.toBeNull();
      expect(node.alternate.type).toBe('BlockStatement');
    });
  });

  describe('ForStatement', () => {
    it('parses mama ghuro loop', () => {
      const src = 'mama ghuro (mama dhori i = 0; i < 10; i++) { mama bolo(i) }';
      const ast = parseSource(src);
      const node = ast.body[0] as any;
      expect(node.type).toBe('ForStatement');
      expect(node.init.type).toBe('VarDeclaration');
      expect(node.test.type).toBe('BinaryExpression');
      expect(node.update.type).toBe('UpdateExpression');
    });
  });

  describe('WhileStatement', () => {
    it('parses mama jotokkhon', () => {
      const ast = parseSource('mama jotokkhon (x < 100) {}');
      const node = ast.body[0] as any;
      expect(node.type).toBe('WhileStatement');
      expect(node.test.type).toBe('BinaryExpression');
    });
  });

  describe('TryCatchStatement', () => {
    it('parses mama panic ... mama dhora', () => {
      const src = `
        mama panic {
          riskyCall()
        } mama dhora(err) {
          mama bolo(err)
        }
      `;
      const ast = parseSource(src);
      const node = ast.body[0] as any;
      expect(node.type).toBe('TryCatchStatement');
      expect(node.catchParam).toBe('err');
    });
  });

  describe('PrintStatement', () => {
    it('parses mama bolo', () => {
      const ast = parseSource('mama bolo("hello")');
      const node = ast.body[0] as any;
      expect(node.type).toBe('PrintStatement');
      expect(node.args[0].type).toBe('StringLiteral');
    });

    it('parses mama bolo with multiple args', () => {
      const ast = parseSource('mama bolo("a", 1, mama shotto)');
      const node = ast.body[0] as any;
      expect(node.args).toHaveLength(3);
    });
  });

  describe('Literals', () => {
    it('parses mama shotto as true', () => {
      const ast = parseSource('mama dhori flag = mama shotto');
      const decl = ast.body[0] as any;
      expect(decl.init.type).toBe('BooleanLiteral');
      expect(decl.init.value).toBe(true);
    });

    it('parses mama miththa as false', () => {
      const ast = parseSource('mama dhori flag = mama miththa');
      const decl = ast.body[0] as any;
      expect(decl.init.value).toBe(false);
    });

    it('parses mama khali as null', () => {
      const ast = parseSource('mama dhori x = mama khali');
      const decl = ast.body[0] as any;
      expect(decl.init.type).toBe('NullLiteral');
    });
  });

  describe('Meme statements', () => {
    it('parses mama hasi', () => {
      const ast = parseSource('mama hasi()');
      const node = ast.body[0] as any;
      expect(node.type).toBe('MemeStatement');
      expect(node.emoji).toBe('😂');
    });

    it('parses mama kanna', () => {
      const ast = parseSource('mama kanna()');
      const node = ast.body[0] as any;
      expect(node.type).toBe('MemeStatement');
      expect(node.emoji).toBe('😭');
    });
  });

  describe('SleepStatement', () => {
    it('parses mama ghum', () => {
      const ast = parseSource('mama ghum(1000)');
      const node = ast.body[0] as any;
      expect(node.type).toBe('SleepStatement');
      expect(node.ms.value).toBe(1000);
    });
  });

  describe('expressions', () => {
    it('parses binary expressions', () => {
      const ast = parseSource('mama dhori x = 1 + 2');
      const decl = ast.body[0] as any;
      expect(decl.init.type).toBe('BinaryExpression');
      expect(decl.init.operator).toBe('+');
    });

    it('parses function calls', () => {
      const ast = parseSource('foo(1, 2)');
      const stmt = ast.body[0] as any;
      expect(stmt.expression.type).toBe('CallExpression');
    });

    it('parses member access', () => {
      const ast = parseSource('obj.method()');
      const stmt = ast.body[0] as any;
      expect(stmt.expression.type).toBe('CallExpression');
      expect(stmt.expression.callee.type).toBe('MemberExpression');
    });

    it('parses array literals', () => {
      const ast = parseSource('mama dhori arr = [1, 2, 3]');
      const decl = ast.body[0] as any;
      expect(decl.init.type).toBe('ArrayExpression');
      expect(decl.init.elements).toHaveLength(3);
    });

    it('parses object literals', () => {
      const ast = parseSource('mama dhori obj = { name: "mama", age: 20 }');
      const decl = ast.body[0] as any;
      expect(decl.init.type).toBe('ObjectExpression');
      expect(decl.init.properties).toHaveLength(2);
    });
  });
});
