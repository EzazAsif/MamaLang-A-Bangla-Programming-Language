/**
 * MamaLang AST Node Definitions
 *
 * Every node carries `line` / `column` for error reporting.
 * Nodes are plain TypeScript interfaces (discriminated union via `type`).
 */
export type ASTNode = Program | VarDeclaration | FunctionDeclaration | ReturnStatement | IfStatement | ForStatement | WhileStatement | TryCatchStatement | ExpressionStatement | BlockStatement | AssignmentExpression | BinaryExpression | UnaryExpression | UpdateExpression | CallExpression | MemberExpression | AwaitExpression | PrintStatement | SleepStatement | MemeStatement | Identifier | NumberLiteral | StringLiteral | BooleanLiteral | NullLiteral | ArrayExpression | ObjectExpression | Property;
export interface BaseNode {
    line: number;
    column: number;
}
export interface Program extends BaseNode {
    type: 'Program';
    body: ASTNode[];
}
export interface VarDeclaration extends BaseNode {
    type: 'VarDeclaration';
    kind: 'let' | 'const';
    name: string;
    init: ASTNode | null;
}
export interface FunctionDeclaration extends BaseNode {
    type: 'FunctionDeclaration';
    name: string;
    params: string[];
    body: BlockStatement;
    isAsync: boolean;
}
export interface ReturnStatement extends BaseNode {
    type: 'ReturnStatement';
    argument: ASTNode | null;
}
export interface IfStatement extends BaseNode {
    type: 'IfStatement';
    test: ASTNode;
    consequent: BlockStatement;
    alternate: BlockStatement | IfStatement | null;
}
export interface ForStatement extends BaseNode {
    type: 'ForStatement';
    init: ASTNode | null;
    test: ASTNode | null;
    update: ASTNode | null;
    body: BlockStatement;
}
export interface WhileStatement extends BaseNode {
    type: 'WhileStatement';
    test: ASTNode;
    body: BlockStatement;
}
export interface TryCatchStatement extends BaseNode {
    type: 'TryCatchStatement';
    tryBlock: BlockStatement;
    catchParam: string | null;
    catchBlock: BlockStatement | null;
}
export interface ExpressionStatement extends BaseNode {
    type: 'ExpressionStatement';
    expression: ASTNode;
}
export interface BlockStatement extends BaseNode {
    type: 'BlockStatement';
    body: ASTNode[];
}
/** mama bolo(...) */
export interface PrintStatement extends BaseNode {
    type: 'PrintStatement';
    args: ASTNode[];
}
/** mama ghum(ms) */
export interface SleepStatement extends BaseNode {
    type: 'SleepStatement';
    ms: ASTNode;
}
/** mama hasi() / mama kanna() */
export interface MemeStatement extends BaseNode {
    type: 'MemeStatement';
    emoji: '😂' | '😭';
}
export interface AssignmentExpression extends BaseNode {
    type: 'AssignmentExpression';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}
export interface BinaryExpression extends BaseNode {
    type: 'BinaryExpression';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}
export interface UnaryExpression extends BaseNode {
    type: 'UnaryExpression';
    operator: string;
    operand: ASTNode;
    prefix: boolean;
}
export interface UpdateExpression extends BaseNode {
    type: 'UpdateExpression';
    operator: '++' | '--';
    argument: ASTNode;
    prefix: boolean;
}
export interface CallExpression extends BaseNode {
    type: 'CallExpression';
    callee: ASTNode;
    args: ASTNode[];
}
export interface MemberExpression extends BaseNode {
    type: 'MemberExpression';
    object: ASTNode;
    property: ASTNode;
    computed: boolean;
}
export interface AwaitExpression extends BaseNode {
    type: 'AwaitExpression';
    argument: ASTNode;
}
export interface Identifier extends BaseNode {
    type: 'Identifier';
    name: string;
}
export interface NumberLiteral extends BaseNode {
    type: 'NumberLiteral';
    value: number;
    raw: string;
}
export interface StringLiteral extends BaseNode {
    type: 'StringLiteral';
    value: string;
    raw: string;
}
export interface BooleanLiteral extends BaseNode {
    type: 'BooleanLiteral';
    value: boolean;
}
export interface NullLiteral extends BaseNode {
    type: 'NullLiteral';
}
export interface ArrayExpression extends BaseNode {
    type: 'ArrayExpression';
    elements: ASTNode[];
}
export interface ObjectExpression extends BaseNode {
    type: 'ObjectExpression';
    properties: Property[];
}
export interface Property extends BaseNode {
    type: 'Property';
    key: string;
    value: ASTNode;
}
//# sourceMappingURL=nodes.d.ts.map