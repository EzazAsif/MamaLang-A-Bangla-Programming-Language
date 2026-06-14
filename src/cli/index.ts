#!/usr/bin/env node
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

import * as fs       from 'fs';
import * as path     from 'path';
import * as os       from 'os';
import * as readline from 'readline';
import { compile, VERSION, CompileError } from '../index';

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const R = '\x1b[0m';
const red    = (s: string) => `\x1b[31m${s}${R}`;
const green  = (s: string) => `\x1b[32m${s}${R}`;
const yellow = (s: string) => `\x1b[33m${s}${R}`;
const cyan   = (s: string) => `\x1b[36m${s}${R}`;
const bold   = (s: string) => `\x1b[1m${s}${R}`;
const magenta= (s: string) => `\x1b[35m${s}${R}`;

// ── Arg parsing ───────────────────────────────────────────────────────────────
const [,, cmd, ...rest] = process.argv;

switch (cmd) {
  case 'run':     cmdRun(rest);     break;
  case 'compile': cmdCompile(rest); break;
  case 'repl':    cmdRepl();        break;
  case 'init':    cmdInit(rest);    break;
  case 'version':
  case '-v':
  case '--version':
    cmdVersion(); break;
  case 'help':
  case '-h':
  case '--help':
  default:
    cmdHelp(); break;
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdHelp() {
  console.log(`
${bold(cyan('MamaLang v' + VERSION))} – Bengali meme programming language 🇧🇩

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
  console.log(bold(cyan(`MamaLang v${VERSION}`)));
  console.log(`Node.js ${process.version}`);
}

function cmdRun(args: string[]) {
  const file = args.find(a => !a.startsWith('-'));
  const debug = args.includes('--debug');
  if (!file) { console.error(red('✗ Usage: mama run <file.mama>')); process.exit(1); }

  const absPath = path.resolve(file);
  if (!fs.existsSync(absPath)) { console.error(red(`✗ File not found: ${absPath}`)); process.exit(1); }

  const source = fs.readFileSync(absPath, 'utf-8');
  let result: ReturnType<typeof compile>;
  try {
    result = compile(source, { filename: path.basename(file) });
  } catch (err) {
    printError(err); process.exit(1);
  }

  if (debug) {
    console.log(yellow('── Compiled JS ──────────────────────────────────'));
    console.log(result!.js);
    console.log(yellow('─────────────────────────────────────────────────'));
  }

  const tmpFile = path.join(os.tmpdir(), `__mama_${Date.now()}.js`);
  fs.writeFileSync(tmpFile, result!.js);
  try {
    require(tmpFile);
  } finally {
    setTimeout(() => { try { fs.unlinkSync(tmpFile); } catch { /**/ } }, 500);
  }
}

function cmdCompile(args: string[]) {
  const fileIdx = args.findIndex(a => !a.startsWith('-'));
  const file = args[fileIdx];
  const outIdx = args.indexOf('-o');
  const outArg = outIdx !== -1 ? args[outIdx + 1] : undefined;

  if (!file) { console.error(red('✗ Usage: mama compile <file.mama> [-o output.js]')); process.exit(1); }

  const absPath = path.resolve(file);
  if (!fs.existsSync(absPath)) { console.error(red(`✗ File not found: ${absPath}`)); process.exit(1); }

  const source = fs.readFileSync(absPath, 'utf-8');
  let result: ReturnType<typeof compile>;
  try {
    result = compile(source, { filename: path.basename(file) });
  } catch (err) {
    printError(err); process.exit(1);
  }

  const outPath = outArg ? path.resolve(outArg) : absPath.replace(/\.mama$/, '.js');
  fs.writeFileSync(outPath, result!.js);

  if (result!.warnings.length > 0) result!.warnings.forEach(w => console.warn(yellow(`⚠  ${w}`)));
  console.log(green('✓ Compiled successfully'));
  console.log(cyan(`  ${path.basename(outPath)} generated`));
}

function cmdRepl() {
  console.log(`\n  ${bold(cyan('MamaLang REPL v' + VERSION))}`);
  console.log(magenta('  Type MamaLang code and press Enter.'));
  console.log(magenta('  Type .exit or Ctrl+C to quit.\n'));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: cyan('mama> ') });
  let buffer = '';
  let depth = 0;

  rl.prompt();

  rl.on('line', async (line: string) => {
    for (const ch of line) { if (ch === '{') depth++; else if (ch === '}') depth--; }
    buffer += line + '\n';

    if (depth <= 0) {
      const src = buffer.trim();
      buffer = ''; depth = 0;
      if (src === '.exit') { console.log(yellow('Bye! 👋')); process.exit(0); }
      if (src.length > 0) {
        try {
          const { js } = compile(src, { filename: 'repl' });
          const tmp = path.join(os.tmpdir(), `__mama_repl_${Date.now()}.js`);
          fs.writeFileSync(tmp, js);
          try {
            delete require.cache[require.resolve(tmp)];
            require(tmp);
            await new Promise(r => setTimeout(r, 150));
          } finally {
            try { fs.unlinkSync(tmp); } catch { /**/ }
          }
        } catch (err) {
          console.error(err instanceof CompileError ? red(err.message) : red(String(err)));
        }
      }
      rl.prompt();
    } else {
      process.stdout.write(cyan('....  '));
    }
  });

  rl.on('close', () => { console.log(yellow('\nBye! 👋')); process.exit(0); });
}

function cmdInit(args: string[]) {
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

function printError(err: unknown) {
  if (err instanceof CompileError) {
    console.error(bold(red('✗ Compile Error')));
    console.error(red(err.message));
  } else {
    console.error(red(String(err)));
  }
}
