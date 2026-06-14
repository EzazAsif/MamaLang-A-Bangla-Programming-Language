"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIME_POSTAMBLE = exports.Generator = void 0;
exports.generate = generate;
// ── Generator ─────────────────────────────────────────────────────────────────
class Generator {
    constructor() {
        this.output = '';
        this.indent = 0;
        this.TAB = '    '; // 4-space indent
        /** Whether the current function scope requires `async`. */
        this.asyncContext = false;
    }
    // ── Public API ─────────────────────────────────────────────────────────────
    generate(program) {
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
    genNode(node) {
        switch (node.type) {
            case 'Program': return node.body.forEach(n => { this.genNode(n); this.emit('\n'); });
            case 'VarDeclaration': return this.genVarDecl(node);
            case 'FunctionDeclaration': return this.genFuncDecl(node);
            case 'ReturnStatement': return this.genReturn(node);
            case 'IfStatement': return this.genIf(node);
            case 'ForStatement': return this.genFor(node);
            case 'WhileStatement': return this.genWhile(node);
            case 'TryCatchStatement': return this.genTryCatch(node);
            case 'PrintStatement': return this.genPrint(node);
            case 'SleepStatement': return this.genSleep(node);
            case 'MemeStatement': return this.genMeme(node);
            case 'ExpressionStatement': return this.genExprStmt(node);
            case 'BlockStatement': return this.genBlock(node);
            case 'AssignmentExpression': return this.genAssignment(node);
            case 'BinaryExpression': return this.genBinary(node);
            case 'UnaryExpression': return this.genUnary(node);
            case 'UpdateExpression': return this.genUpdate(node);
            case 'CallExpression': return this.genCall(node);
            case 'MemberExpression': return this.genMember(node);
            case 'AwaitExpression': return this.genAwait(node);
            case 'Identifier': return this.genIdentifier(node);
            case 'NumberLiteral': return this.emit(node.raw);
            case 'StringLiteral': return this.emit(node.raw);
            case 'BooleanLiteral': return this.emit(node.value ? 'true' : 'false');
            case 'NullLiteral': return this.emit('null');
            case 'ArrayExpression': return this.genArray(node);
            case 'ObjectExpression': return this.genObject(node);
            default:
                // Exhaustiveness guard
                throw new Error(`[Generator] Unhandled node type: ${node.type}`);
        }
    }
    // ── Declarations ──────────────────────────────────────────────────────────
    genVarDecl(node) {
        this.emitIndent();
        this.emit(`${node.kind} ${node.name}`);
        if (node.init) {
            this.emit(' = ');
            this.genNode(node.init);
        }
        this.emit(';');
    }
    genFuncDecl(node) {
        // Detect if body contains await → make function async
        const needsAsync = this.containsAwait(node.body);
        const asyncKeyword = needsAsync ? 'async ' : '';
        this.emitIndent();
        this.emit(`${asyncKeyword}function ${node.name}(${node.params.join(', ')}) `);
        this.genBlock(node.body);
    }
    // ── Statements ─────────────────────────────────────────────────────────────
    genReturn(node) {
        this.emitIndent();
        this.emit('return');
        if (node.argument) {
            this.emit(' ');
            this.genNode(node.argument);
        }
        this.emit(';');
    }
    genIf(node) {
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
            }
            else {
                this.genBlock(node.alternate);
            }
        }
    }
    genElseChain(node) {
        if (node.type === 'IfStatement') {
            this.emit(' else if (');
            this.genNode(node.test);
            this.emit(') ');
            this.genBlock(node.consequent);
            if (node.alternate)
                this.genElseChain(node.alternate);
        }
        else {
            this.emit(' else ');
            this.genBlock(node);
        }
    }
    genFor(node) {
        this.emitIndent();
        this.emit('for (');
        if (node.init) {
            if (node.init.type === 'VarDeclaration') {
                this.emit(`${node.init.kind} ${node.init.name}`);
                if (node.init.init) {
                    this.emit(' = ');
                    this.genNode(node.init.init);
                }
            }
            else {
                this.genNode(node.init);
            }
        }
        this.emit('; ');
        if (node.test)
            this.genNode(node.test);
        this.emit('; ');
        if (node.update)
            this.genNode(node.update);
        this.emit(') ');
        this.genBlock(node.body);
    }
    genWhile(node) {
        this.emitIndent();
        this.emit('while (');
        this.genNode(node.test);
        this.emit(') ');
        this.genBlock(node.body);
    }
    genTryCatch(node) {
        this.emitIndent();
        this.emit('try ');
        this.genBlock(node.tryBlock);
        if (node.catchBlock) {
            const param = node.catchParam ? `(${node.catchParam})` : '';
            this.emit(` catch${param} `);
            this.genBlock(node.catchBlock);
        }
    }
    genPrint(node) {
        this.emitIndent();
        this.emit('console.log(');
        node.args.forEach((arg, i) => {
            this.genNode(arg);
            if (i < node.args.length - 1)
                this.emit(', ');
        });
        this.emit(');');
    }
    genSleep(node) {
        this.emitIndent();
        this.emit('await new Promise(r => setTimeout(r, ');
        this.genNode(node.ms);
        this.emit('));');
    }
    genMeme(node) {
        this.emitIndent();
        this.emit(`console.log("${node.emoji}");`);
    }
    genExprStmt(node) {
        this.emitIndent();
        this.genNode(node.expression);
        this.emit(';');
    }
    genBlock(node) {
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
    genAssignment(node) {
        this.genNode(node.left);
        this.emit(` ${node.operator} `);
        this.genNode(node.right);
    }
    genBinary(node) {
        this.emit('(');
        this.genNode(node.left);
        this.emit(` ${node.operator} `);
        this.genNode(node.right);
        this.emit(')');
    }
    genUnary(node) {
        if (node.prefix) {
            this.emit(node.operator);
            this.genNode(node.operand);
        }
        else {
            this.genNode(node.operand);
            this.emit(node.operator);
        }
    }
    genUpdate(node) {
        if (node.prefix) {
            this.emit(node.operator);
            this.genNode(node.argument);
        }
        else {
            this.genNode(node.argument);
            this.emit(node.operator);
        }
    }
    genCall(node) {
        this.genNode(node.callee);
        this.emit('(');
        node.args.forEach((arg, i) => {
            this.genNode(arg);
            if (i < node.args.length - 1)
                this.emit(', ');
        });
        this.emit(')');
    }
    genMember(node) {
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
        }
        else {
            this.emit('.');
            this.genNode(node.property);
        }
    }
    genAwait(node) {
        this.emit('await ');
        this.genNode(node.argument);
    }
    genIdentifier(node) {
        this.emit(node.name);
    }
    genArray(node) {
        this.emit('[');
        node.elements.forEach((el, i) => {
            this.genNode(el);
            if (i < node.elements.length - 1)
                this.emit(', ');
        });
        this.emit(']');
    }
    genObject(node) {
        if (node.properties.length === 0) {
            this.emit('{}');
            return;
        }
        this.emit('{\n');
        this.indent++;
        node.properties.forEach((prop, i) => {
            this.emitIndent();
            this.emit(`${prop.key}: `);
            this.genNode(prop.value);
            if (i < node.properties.length - 1)
                this.emit(',');
            this.emit('\n');
        });
        this.indent--;
        this.emitIndent();
        this.emit('}');
    }
    // ── Utilities ──────────────────────────────────────────────────────────────
    emit(text) { this.output += text; }
    emitIndent() { this.output += this.TAB.repeat(this.indent); }
    /**
     * Cheap heuristic: walk a block and check if any AwaitExpression node lives
     * inside it. Used to auto-insert the `async` modifier on function declarations.
     */
    containsAwait(node) {
        if (!node)
            return false;
        if (node.type === 'AwaitExpression')
            return true;
        if (node.type === 'SleepStatement')
            return true;
        for (const value of Object.values(node)) {
            if (Array.isArray(value)) {
                if (value.some((v) => typeof v === 'object' && v !== null && this.containsAwait(v)))
                    return true;
            }
            else if (typeof value === 'object' && value !== null && 'type' in value) {
                if (this.containsAwait(value))
                    return true;
            }
        }
        return false;
    }
}
exports.Generator = Generator;
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
exports.RUNTIME_POSTAMBLE = `
})();
`;
// ── Convenience export ────────────────────────────────────────────────────────
function generate(program) {
    const gen = new Generator();
    const body = gen.generate(program);
    return body + exports.RUNTIME_POSTAMBLE;
}
//# sourceMappingURL=generator.js.map