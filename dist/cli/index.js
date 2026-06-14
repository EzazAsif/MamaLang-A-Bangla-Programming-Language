#!/usr/bin/env node
"use strict";
/**
 * MamaLang CLI
 *
 * Commands:
 *   mama run <file>      – compile + execute
 *   mama compile <file>  – compile to .js only
 *   mama repl            – interactive REPL
 *   mama version         – print version
 *   mama init            – scaffold a new MamaLang project
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const index_1 = require("../index");
// ── Chalk-lite (avoid ESM issues) ─────────────────────────────────────────────
// We use ANSI codes directly for maximum compatibility.
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};
const color = (c, s) => `${c}${s}${C.reset}`;
// ── Program ───────────────────────────────────────────────────────────────────
const program = new commander_1.Command();
program
    .name('mama')
    .description(color(C.cyan + C.bold, 'MamaLang') + ' – Bengali meme programming language 🇧🇩')
    .version(index_1.VERSION, '-v, --version');
// ── mama run ─────────────────────────────────────────────────────────────────
program
    .command('run <file>')
    .description('Compile and run a .mama file')
    .option('--debug', 'Print compiled JS before executing')
    .action(async (file, options) => {
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
        console.error(color(C.red, `✗ File not found: ${absPath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(absPath, 'utf-8');
    let result;
    try {
        result = (0, index_1.compile)(source, { filename: path.basename(file) });
    }
    catch (err) {
        printCompileError(err);
        process.exit(1);
    }
    if (options.debug) {
        console.log(color(C.yellow, '── Compiled JS ──────────────────────────────────'));
        console.log(result.js);
        console.log(color(C.yellow, '─────────────────────────────────────────────────'));
    }
    // Write a temp file and execute it with Node
    const tmpFile = path.join(require('os').tmpdir(), `__mama_${Date.now()}.js`);
    fs.writeFileSync(tmpFile, result.js);
    try {
        require(tmpFile);
    }
    finally {
        // Clean up temp file after a tick
        setTimeout(() => {
            try {
                fs.unlinkSync(tmpFile);
            }
            catch { /* ignore */ }
        }, 500);
    }
});
// ── mama compile ─────────────────────────────────────────────────────────────
program
    .command('compile <file>')
    .description('Compile a .mama file to JavaScript')
    .option('-o, --output <path>', 'Output file path')
    .action((file, options) => {
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
        console.error(color(C.red, `✗ File not found: ${absPath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(absPath, 'utf-8');
    let result;
    try {
        result = (0, index_1.compile)(source, { filename: path.basename(file) });
    }
    catch (err) {
        printCompileError(err);
        process.exit(1);
    }
    const outPath = options.output ?? absPath.replace(/\.mama$/, '.js');
    fs.writeFileSync(outPath, result.js);
    if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.warn(color(C.yellow, `⚠  ${w}`)));
    }
    console.log(color(C.green, `✓ Compiled successfully`));
    console.log(color(C.cyan, `  ${path.basename(outPath)} generated`));
});
// ── mama repl ────────────────────────────────────────────────────────────────
program
    .command('repl')
    .description('Start the MamaLang interactive REPL')
    .action(async () => {
    console.log(color(C.cyan + C.bold, '\n  MamaLang REPL v' + index_1.VERSION));
    console.log(color(C.magenta, '  Type MamaLang code and press Enter to run.'));
    console.log(color(C.magenta, '  Type .exit or press Ctrl+C to quit.\n'));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: color(C.cyan, 'mama> '),
    });
    let buffer = '';
    let depth = 0; // brace depth for multi-line input
    rl.prompt();
    rl.on('line', async (line) => {
        // Count brace depth
        for (const ch of line) {
            if (ch === '{')
                depth++;
            if (ch === '}')
                depth--;
        }
        buffer += line + '\n';
        // When all braces are closed (or single-line), run the buffer
        if (depth <= 0) {
            const src = buffer.trim();
            buffer = '';
            depth = 0;
            if (src === '.exit') {
                console.log(color(C.yellow, 'Bye! 👋'));
                process.exit(0);
            }
            if (src.length > 0) {
                try {
                    const { js } = (0, index_1.compile)(src, { filename: 'repl', noWrapper: false });
                    // Suppress the preamble for REPL output and just eval the body
                    await evalInContext(js);
                }
                catch (err) {
                    if (err instanceof index_1.CompileError) {
                        console.error(color(C.red, err.message));
                    }
                    else {
                        console.error(color(C.red, String(err)));
                    }
                }
            }
            rl.prompt();
        }
        else {
            // Continuation prompt
            process.stdout.write(color(C.cyan, '....  '));
        }
    });
    rl.on('close', () => {
        console.log(color(C.yellow, '\nBye! 👋'));
        process.exit(0);
    });
});
// ── mama version ─────────────────────────────────────────────────────────────
program
    .command('version')
    .description('Print MamaLang version')
    .action(() => {
    console.log(color(C.cyan + C.bold, `MamaLang v${index_1.VERSION}`));
    console.log(`Node.js ${process.version}`);
});
// ── mama init ────────────────────────────────────────────────────────────────
program
    .command('init [directory]')
    .description('Scaffold a new MamaLang project')
    .action((dir = '.') => {
    const target = path.resolve(dir);
    fs.mkdirSync(target, { recursive: true });
    const helloSrc = `// MamaLang Hello World
mama bolo("Assalamu Alaikum, Duniya! 🌍")

mama dhori naam = "Mama"
mama bolo("Tomar naam ki? " + naam)

mama dhori boyosh = 20
mama jodi (boyosh >= 18) {
    mama bolo("Tumi boro")
} mama nahole {
    mama bolo("Tumi choto")
}
`;
    fs.writeFileSync(path.join(target, 'hello.mama'), helloSrc);
    const pkgJson = {
        name: path.basename(target),
        version: '0.1.0',
        description: 'A MamaLang project',
        scripts: { start: 'mama run hello.mama' },
    };
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(pkgJson, null, 2));
    fs.writeFileSync(path.join(target, '.gitignore'), 'node_modules\n*.js\ndist\n');
    console.log(color(C.green, '✓ Project created!'));
    console.log(color(C.cyan, `  cd ${dir !== '.' ? dir : '.'}`));
    console.log(color(C.cyan, '  mama run hello.mama'));
});
// ── Error formatter ───────────────────────────────────────────────────────────
function printCompileError(err) {
    if (err instanceof index_1.CompileError) {
        console.error(color(C.red + C.bold, '✗ Compile Error'));
        console.error(color(C.red, err.message));
    }
    else {
        console.error(color(C.red, String(err)));
    }
}
// ── REPL eval helper ─────────────────────────────────────────────────────────
async function evalInContext(js) {
    const tmpFile = path.join(require('os').tmpdir(), `__mama_repl_${Date.now()}.js`);
    fs.writeFileSync(tmpFile, js);
    try {
        // Clear require cache for repeated evals in the REPL
        delete require.cache[require.resolve(tmpFile)];
        require(tmpFile);
        // Small wait so async IIFE output is flushed before next prompt
        await new Promise(r => setTimeout(r, 150));
    }
    finally {
        try {
            fs.unlinkSync(tmpFile);
        }
        catch { /* ignore */ }
    }
}
// ── Parse & run ───────────────────────────────────────────────────────────────
program.parse(process.argv);
//# sourceMappingURL=index.js.map