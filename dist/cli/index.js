#!/usr/bin/env node
"use strict";
/**
 * MamaLang CLI  –  zero runtime dependencies (pure Node.js)
 *
 * Commands:
 *   mama run <file>       compile + execute
 *   mama compile <file>   compile to .js only
 *   mama repl             interactive REPL
 *   mama init [dir]       scaffold a new project
 *   mama version          print version
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const readline = __importStar(require("readline"));
const index_1 = require("../index");
// ── ANSI helpers ──────────────────────────────────────────────────────────────
const R = '\x1b[0m';
const red = (s) => `\x1b[31m${s}${R}`;
const green = (s) => `\x1b[32m${s}${R}`;
const yellow = (s) => `\x1b[33m${s}${R}`;
const cyan = (s) => `\x1b[36m${s}${R}`;
const bold = (s) => `\x1b[1m${s}${R}`;
const magenta = (s) => `\x1b[35m${s}${R}`;
// ── Arg parsing ───────────────────────────────────────────────────────────────
const [, , cmd, ...rest] = process.argv;
switch (cmd) {
    case 'run':
        cmdRun(rest);
        break;
    case 'compile':
        cmdCompile(rest);
        break;
    case 'repl':
        cmdRepl();
        break;
    case 'init':
        cmdInit(rest);
        break;
    case 'version':
    case '-v':
    case '--version':
        cmdVersion();
        break;
    case 'help':
    case '-h':
    case '--help':
    default:
        cmdHelp();
        break;
}
// ── Commands ──────────────────────────────────────────────────────────────────
function cmdHelp() {
    console.log(`
${bold(cyan('MamaLang v' + index_1.VERSION))} – Bengali meme programming language 🇧🇩

${bold('Usage:')}
  mama run <file>          Compile and run a .mama file
  mama compile <file>      Compile .mama → .js  (use -o <out> to set output path)
  mama repl                Start interactive REPL
  mama init [directory]    Scaffold a new MamaLang project
  mama version             Print version

${bold('Examples:')}
  mama run hello.mama
  mama compile app.mama -o app.js
  mama repl
`);
}
function cmdVersion() {
    console.log(bold(cyan(`MamaLang v${index_1.VERSION}`)));
    console.log(`Node.js ${process.version}`);
}
function cmdRun(args) {
    const file = args.find(a => !a.startsWith('-'));
    const debug = args.includes('--debug');
    if (!file) {
        console.error(red('✗ Usage: mama run <file.mama>'));
        process.exit(1);
    }
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
        console.error(red(`✗ File not found: ${absPath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(absPath, 'utf-8');
    let result;
    try {
        result = (0, index_1.compile)(source, { filename: path.basename(file) });
    }
    catch (err) {
        printError(err);
        process.exit(1);
    }
    if (debug) {
        console.log(yellow('── Compiled JS ──────────────────────────────────'));
        console.log(result.js);
        console.log(yellow('─────────────────────────────────────────────────'));
    }
    const tmpFile = path.join(os.tmpdir(), `__mama_${Date.now()}.js`);
    fs.writeFileSync(tmpFile, result.js);
    try {
        require(tmpFile);
    }
    finally {
        setTimeout(() => { try {
            fs.unlinkSync(tmpFile);
        }
        catch { /**/ } }, 500);
    }
}
function cmdCompile(args) {
    const fileIdx = args.findIndex(a => !a.startsWith('-'));
    const file = args[fileIdx];
    const outIdx = args.indexOf('-o');
    const outArg = outIdx !== -1 ? args[outIdx + 1] : undefined;
    if (!file) {
        console.error(red('✗ Usage: mama compile <file.mama> [-o output.js]'));
        process.exit(1);
    }
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
        console.error(red(`✗ File not found: ${absPath}`));
        process.exit(1);
    }
    const source = fs.readFileSync(absPath, 'utf-8');
    let result;
    try {
        result = (0, index_1.compile)(source, { filename: path.basename(file) });
    }
    catch (err) {
        printError(err);
        process.exit(1);
    }
    const outPath = outArg ? path.resolve(outArg) : absPath.replace(/\.mama$/, '.js');
    fs.writeFileSync(outPath, result.js);
    if (result.warnings.length > 0)
        result.warnings.forEach(w => console.warn(yellow(`⚠  ${w}`)));
    console.log(green('✓ Compiled successfully'));
    console.log(cyan(`  ${path.basename(outPath)} generated`));
}
function cmdRepl() {
    console.log(`\n  ${bold(cyan('MamaLang REPL v' + index_1.VERSION))}`);
    console.log(magenta('  Type MamaLang code and press Enter.'));
    console.log(magenta('  Type .exit or Ctrl+C to quit.\n'));
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: cyan('mama> ') });
    let buffer = '';
    let depth = 0;
    rl.prompt();
    rl.on('line', async (line) => {
        for (const ch of line) {
            if (ch === '{')
                depth++;
            else if (ch === '}')
                depth--;
        }
        buffer += line + '\n';
        if (depth <= 0) {
            const src = buffer.trim();
            buffer = '';
            depth = 0;
            if (src === '.exit') {
                console.log(yellow('Bye! 👋'));
                process.exit(0);
            }
            if (src.length > 0) {
                try {
                    const { js } = (0, index_1.compile)(src, { filename: 'repl' });
                    const tmp = path.join(os.tmpdir(), `__mama_repl_${Date.now()}.js`);
                    fs.writeFileSync(tmp, js);
                    try {
                        delete require.cache[require.resolve(tmp)];
                        require(tmp);
                        await new Promise(r => setTimeout(r, 150));
                    }
                    finally {
                        try {
                            fs.unlinkSync(tmp);
                        }
                        catch { /**/ }
                    }
                }
                catch (err) {
                    console.error(err instanceof index_1.CompileError ? red(err.message) : red(String(err)));
                }
            }
            rl.prompt();
        }
        else {
            process.stdout.write(cyan('....  '));
        }
    });
    rl.on('close', () => { console.log(yellow('\nBye! 👋')); process.exit(0); });
}
function cmdInit(args) {
    const dir = args[0] ?? '.';
    const target = path.resolve(dir);
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'hello.mama'), `// MamaLang Hello World
mama bolo("Assalamu Alaikum, Duniya! 🌍")

mama dhori naam = "Mama"
mama bolo("Tomar naam: " + naam)

mama dhori boyosh = 20
mama jodi (boyosh >= 18) {
    mama bolo("Tumi boro!")
} mama nahole {
    mama bolo("Tumi choto!")
}
`);
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({
        name: path.basename(target), version: '0.1.0',
        scripts: { start: 'mama run hello.mama' }
    }, null, 2));
    fs.writeFileSync(path.join(target, '.gitignore'), 'node_modules\n*.js\ndist\n');
    console.log(green('✓ Project created!'));
    console.log(cyan(`  cd ${dir !== '.' ? dir : '.'}`));
    console.log(cyan('  mama run hello.mama'));
}
function printError(err) {
    if (err instanceof index_1.CompileError) {
        console.error(bold(red('✗ Compile Error')));
        console.error(red(err.message));
    }
    else {
        console.error(red(String(err)));
    }
}
//# sourceMappingURL=index.js.map