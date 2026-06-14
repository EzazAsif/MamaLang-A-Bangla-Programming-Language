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
export declare class Generator {
    private output;
    private indent;
    private TAB;
    /** Whether the current function scope requires `async`. */
    private asyncContext;
    generate(program: AST.Program): string;
    private genNode;
    private genVarDecl;
    private genFuncDecl;
    private genReturn;
    private genIf;
    private genElseChain;
    private genFor;
    private genWhile;
    private genTryCatch;
    private genPrint;
    private genSleep;
    private genMeme;
    private genExprStmt;
    private genBlock;
    private genAssignment;
    private genBinary;
    private genUnary;
    private genUpdate;
    private genCall;
    private genMember;
    private genAwait;
    private genIdentifier;
    private genArray;
    private genObject;
    private emit;
    private emitIndent;
    /**
     * Cheap heuristic: walk a block and check if any AwaitExpression node lives
     * inside it. Used to auto-insert the `async` modifier on function declarations.
     */
    private containsAwait;
}
export declare const RUNTIME_POSTAMBLE = "\n})();\n";
export declare function generate(program: AST.Program): string;
//# sourceMappingURL=generator.d.ts.map