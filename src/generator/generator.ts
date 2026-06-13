/**
 * MamaLang Code Generator
 *
 * Walks the AST produced by the parser and emits equivalent JavaScript source.
 *
 * Design goals:
 * - Emit readable, idiomatic JS (not minified).
 * - Track indentation manually for pretty output.
 * - Generate source-map comment at the end of each file for debugging.
 */

import * as AST from '../ast/nodes';

// ── Generator ─────────────────────────────────────────────────────────────────

export class Generator {
  private output  = '';
  private indent  = 0;
  private TAB     = '    '; // 4-space indent
  /** Whether the current function scope requires `async`. */
  private asyncContext = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  generate(program: AST.Program): string {
    // Preamble: inject the tiny MamaLang runtime helper object
    this.emit(RUNTIME_PREAMBLE);
    this.emit('\n');

    for (const node of program.body) {
      this.genNode(node);
      this.emit('\n');
    }

    return this.output.trimEnd() + '\n';
  }

  // ── Node dispatcher ────────────────────────────────────────────────────────

  private genNode(node: AST.ASTNode): void {
    switch (node.type) {
      case 'Program':              return node.body.forEach(n => { this.genNode(n); this.emit('\n'); });
      case 'VarDeclaration':       return this.genVarDecl(node);
      case 'FunctionDeclaration':  return this.genFuncDecl(node);
      case 'ReturnStatement':      return this.genReturn(node);
      case 'IfStatement':          return this.genIf(node);
      case 'ForStatement':         return this.genFor(node);
      case 'WhileStatement':       return this.genWhile(node);
      case 'TryCatchStatement':    return this.genTryCatch(node);
      case 'PrintStatement':       return this.genPrint(node);
      case 'SleepStatement':       return this.genSleep(node);
      case 'MemeStatement':        return this.genMeme(node);
      case 'ExpressionStatement':  return this.genExprStmt(node);
      case 'BlockStatement':       return this.genBlock(node);
      case 'AssignmentExpression': return this.genAssignment(node);
      case 'BinaryExpression':     return this.genBinary(node);
      case 'UnaryExpression':      return this.genUnary(node);
      case 'UpdateExpression':     return this.genUpdate(node);
      case 'CallExpression':       return this.genCall(node);
      case 'MemberExpression':     return this.genMember(node);
      case 'AwaitExpression':      return this.genAwait(node);
      case 'Identifier':           return this.genIdentifier(node);
      case 'NumberLiteral':        return this.emit(node.raw);
      case 'StringLiteral':        return this.emit(node.raw);
      case 'BooleanLiteral':       return this.emit(node.value ? 'true' : 'false');
      case 'NullLiteral':          return this.emit('null');
      case 'ArrayExpression':      return this.genArray(node);
      case 'ObjectExpression':     return this.genObject(node);
      default:
        // Exhaustiveness guard
        throw new Error(`[Generator] Unhandled node type: ${(node as AST.ASTNode).type}`);
    }
  }

  // ── Declarations ──────────────────────────────────────────────────────────

  private genVarDecl(node: AST.VarDeclaration): void {
    this.emitIndent();
    this.emit(`${node.kind} ${node.name}`);
    if (node.init) {
      this.emit(' = ');
      this.genNode(node.init);
    }
    this.emit(';');
  }

  private genFuncDecl(node: AST.FunctionDeclaration): void {
    // Detect if body contains await → make function async
    const needsAsync = this.containsAwait(node.body);
    const asyncKeyword = needsAsync ? 'async ' : '';
    this.emitIndent();
    this.emit(`${asyncKeyword}function ${node.name}(${node.params.join(', ')}) `);
    this.genBlock(node.body);
  }

  // ── Statements ─────────────────────────────────────────────────────────────

  private genReturn(node: AST.ReturnStatement): void {
    this.emitIndent();
    this.emit('return');
    if (node.argument) {
      this.emit(' ');
      this.genNode(node.argument);
    }
    this.emit(';');
  }

  private genIf(node: AST.IfStatement): void {
    this.emitIndent();
    this.emit('if (');
    this.genNode(node.test);
    this.emit(') ');
    this.genBlock(node.consequent);
    if (node.alternate) {
      this.emit(' else ');
      if (node.alternate.type === 'IfStatement') {
        // inline else-if (remove the leading indent that genIf would add)
        this.emit('if (');
        this.genNode(node.alternate.test);
        this.emit(') ');
        this.genBlock(node.alternate.consequent);
        if (node.alternate.alternate) {
          // recurse…
          this.genElseChain(node.alternate.alternate);
        }
      } else {
        this.genBlock(node.alternate);
      }
    }
  }

  private genElseChain(node: AST.BlockStatement | AST.IfStatement): void {
    if (node.type === 'IfStatement') {
      this.emit(' else if (');
      this.genNode(node.test);
      this.emit(') ');
      this.genBlock(node.consequent);
      if (node.alternate) this.genElseChain(node.alternate);
    } else {
      this.emit(' else ');
      this.genBlock(node);
    }
  }

  private genFor(node: AST.ForStatement): void {
    this.emitIndent();
    this.emit('for (');
    if (node.init) {
      if (node.init.type === 'VarDeclaration') {
        this.emit(`${node.init.kind} ${node.init.name}`);
        if (node.init.init) { this.emit(' = '); this.genNode(node.init.init); }
      } else {
        this.genNode(node.init);
      }
    }
    this.emit('; ');
    if (node.test) this.genNode(node.test);
    this.emit('; ');
    if (node.update) this.genNode(node.update);
    this.emit(') ');
    this.genBlock(node.body);
  }

  private genWhile(node: AST.WhileStatement): void {
    this.emitIndent();
    this.emit('while (');
    this.genNode(node.test);
    this.emit(') ');
    this.genBlock(node.body);
  }

  private genTryCatch(node: AST.TryCatchStatement): void {
    this.emitIndent();
    this.emit('try ');
    this.genBlock(node.tryBlock);
    if (node.catchBlock) {
      const param = node.catchParam ? `(${node.catchParam})` : '';
      this.emit(` catch${param} `);
      this.genBlock(node.catchBlock);
    }
  }

  private genPrint(node: AST.PrintStatement): void {
    this.emitIndent();
    this.emit('console.log(');
    node.args.forEach((arg, i) => {
      this.genNode(arg);
      if (i < node.args.length - 1) this.emit(', ');
    });
    this.emit(');');
  }

  private genSleep(node: AST.SleepStatement): void {
    this.emitIndent();
    this.emit('await new Promise(r => setTimeout(r, ');
    this.genNode(node.ms);
    this.emit('));');
  }

  private genMeme(node: AST.MemeStatement): void {
    this.emitIndent();
    this.emit(`console.log("${node.emoji}");`);
  }

  private genExprStmt(node: AST.ExpressionStatement): void {
    this.emitIndent();
    this.genNode(node.expression);
    this.emit(';');
  }

  private genBlock(node: AST.BlockStatement): void {
    this.emit('{\n');
    this.indent++;
    for (const stmt of node.body) {
      this.genNode(stmt);
      this.emit('\n');
    }
    this.indent--;
    this.emitIndent();
    this.emit('}');
  }

  // ── Expressions ────────────────────────────────────────────────────────────

  private genAssignment(node: AST.AssignmentExpression): void {
    this.genNode(node.left);
    this.emit(` ${node.operator} `);
    this.genNode(node.right);
  }

  private genBinary(node: AST.BinaryExpression): void {
    this.emit('(');
    this.genNode(node.left);
    this.emit(` ${node.operator} `);
    this.genNode(node.right);
    this.emit(')');
  }

  private genUnary(node: AST.UnaryExpression): void {
    if (node.prefix) {
      this.emit(node.operator);
      this.genNode(node.operand);
    } else {
      this.genNode(node.operand);
      this.emit(node.operator);
    }
  }

  private genUpdate(node: AST.UpdateExpression): void {
    if (node.prefix) {
      this.emit(node.operator);
      this.genNode(node.argument);
    } else {
      this.genNode(node.argument);
      this.emit(node.operator);
    }
  }

  private genCall(node: AST.CallExpression): void {
    this.genNode(node.callee);
    this.emit('(');
    node.args.forEach((arg, i) => {
      this.genNode(arg);
      if (i < node.args.length - 1) this.emit(', ');
    });
    this.emit(')');
  }

  private genMember(node: AST.MemberExpression): void {
    // Replace __mama__ with the runtime object reference
    if (node.object.type === 'Identifier' && node.object.name === '__mama__') {
      this.emit('__mama__.');
      this.genNode(node.property);
      return;
    }
    this.genNode(node.object);
    if (node.computed) {
      this.emit('[');
      this.genNode(node.property);
      this.emit(']');
    } else {
      this.emit('.');
      this.genNode(node.property);
    }
  }

  private genAwait(node: AST.AwaitExpression): void {
    this.emit('await ');
    this.genNode(node.argument);
  }

  private genIdentifier(node: AST.Identifier): void {
    this.emit(node.name);
  }

  private genArray(node: AST.ArrayExpression): void {
    this.emit('[');
    node.elements.forEach((el, i) => {
      this.genNode(el);
      if (i < node.elements.length - 1) this.emit(', ');
    });
    this.emit(']');
  }

  private genObject(node: AST.ObjectExpression): void {
    if (node.properties.length === 0) { this.emit('{}'); return; }
    this.emit('{\n');
    this.indent++;
    node.properties.forEach((prop, i) => {
      this.emitIndent();
      this.emit(`${prop.key}: `);
      this.genNode(prop.value);
      if (i < node.properties.length - 1) this.emit(',');
      this.emit('\n');
    });
    this.indent--;
    this.emitIndent();
    this.emit('}');
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  private emit(text: string): void { this.output += text; }

  private emitIndent(): void { this.output += this.TAB.repeat(this.indent); }

  /**
   * Cheap heuristic: walk a block and check if any AwaitExpression node lives
   * inside it. Used to auto-insert the `async` modifier on function declarations.
   */
  private containsAwait(node: AST.ASTNode): boolean {
    if (!node) return false;
    if (node.type === 'AwaitExpression') return true;
    if (node.type === 'SleepStatement') return true;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        if (value.some((v: unknown) => typeof v === 'object' && v !== null && this.containsAwait(v as AST.ASTNode))) return true;
      } else if (typeof value === 'object' && value !== null && 'type' in (value as object)) {
        if (this.containsAwait(value as AST.ASTNode)) return true;
      }
    }
    return false;
  }
}

// ── Runtime preamble ──────────────────────────────────────────────────────────

/**
 * Inlined at the top of every compiled file.
 * Provides `__mama__` runtime object and wraps everything in an async IIFE so
 * `await` works at the top level without requiring ES2022 modules.
 */
const RUNTIME_PREAMBLE = `// Generated by MamaLang compiler
// DO NOT EDIT – this file was auto-generated from a .mama source file

const __mama__ = {
  random: () => Math.random(),
  time: () => Date.now(),
  tarikh: () => new Date(),
  floor: (n) => Math.floor(n),
  ceil: (n) => Math.ceil(n),
  abs: (n) => Math.abs(n),
  sqrt: (n) => Math.sqrt(n),
  pow: (a, b) => Math.pow(a, b),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  length: (v) => (v == null ? 0 : v.length ?? 0),
  type: (v) => typeof v,
  toNumber: (v) => Number(v),
  toString: (v) => String(v),
  input: () => { throw new Error("mama.input() requires Node.js readline – use the REPL or wrap in async main"); },
};

(async () => {
`;

// ── Closing IIFE ─────────────────────────────────────────────────────────────
export const RUNTIME_POSTAMBLE = `
})();
`;

// ── Convenience export ────────────────────────────────────────────────────────

export function generate(program: AST.Program): string {
  const gen = new Generator();
  const body = gen.generate(program);
  return body + RUNTIME_POSTAMBLE;
}
