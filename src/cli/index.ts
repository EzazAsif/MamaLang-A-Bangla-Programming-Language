#!/usr/bin/env node
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

import { Command }                     from 'commander';
import * as fs                         from 'fs';
import * as path                       from 'path';
import * as readline                   from 'readline';
import { compile, VERSION, CompileError } from '../index';

// ── Chalk-lite (avoid ESM issues) ─────────────────────────────────────────────
// We use ANSI codes directly for maximum compatibility.
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  magenta:'\x1b[35m',
};
const color = (c: string, s: string) => `${c}${s}${C.reset}`;

// ── Program ───────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('mama')
  .description(color(C.cyan + C.bold, 'MamaLang') + ' – Bengali meme programming language 🇧🇩')
  .version(VERSION, '-v, --version');

// ── mama run ─────────────────────────────────────────────────────────────────

program
  .command('run <file>')
  .description('Compile and run a .mama file')
  .option('--debug', 'Print compiled JS before executing')
  .action(async (file: string, options: { debug?: boolean }) => {
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
      console.error(color(C.red, `✗ File not found: ${absPath}`));
      process.exit(1);
    }
    const source = fs.readFileSync(absPath, 'utf-8');

    let result;
    try {
      result = compile(source, { filename: path.basename(file) });
    } catch (err) {
      printCompileError(err);
      process.exit(1);
    }

    if (options.debug) {
      console.log(color(C.yellow, '── Compiled JS ──────────────────────────────────'));
      console.log(result.js);
      console.log(color(C.yellow, '─────────────────────────────────────────────────'));
    }

    // Write a temp file and execute it with Node
    const tmpFile = path.join(
      require('os').tmpdir(),
      `__mama_${Date.now()}.js`,
    );
    fs.writeFileSync(tmpFile, result.js);
    try {
      require(tmpFile);
    } finally {
      // Clean up temp file after a tick
      setTimeout(() => {
        try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      }, 500);
    }
  });

// ── mama compile ─────────────────────────────────────────────────────────────

program
  .command('compile <file>')
  .description('Compile a .mama file to JavaScript')
  .option('-o, --output <path>', 'Output file path')
  .action((file: string, options: { output?: string }) => {
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
      console.error(color(C.red, `✗ File not found: ${absPath}`));
      process.exit(1);
    }
    const source = fs.readFileSync(absPath, 'utf-8');

    let result;
    try {
      result = compile(source, { filename: path.basename(file) });
    } catch (err) {
      printCompileError(err);
      process.exit(1);
    }

    const outPath = options.output ?? absPath.replace(/\.mama$/, '.js');
    fs.writeFileSync(outPath, result.js);

    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.warn(color(C.yellow, `⚠  ${w}`)));
    }

    console.log(color(C.green, `✓ Compiled successfully`));
    console.log(color(C.cyan,  `  ${path.basename(outPath)} generated`));
  });

// ── mama repl ────────────────────────────────────────────────────────────────

program
  .command('repl')
  .description('Start the MamaLang interactive REPL')
  .action(async () => {
    console.log(color(C.cyan + C.bold, '\n  MamaLang REPL v' + VERSION));
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

    rl.on('line', async (line: string) => {
      // Count brace depth
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
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
            const { js } = compile(src, { filename: 'repl', noWrapper: false });
            // Suppress the preamble for REPL output and just eval the body
            await evalInContext(js);
          } catch (err) {
            if (err instanceof CompileError) {
              console.error(color(C.red, err.message));
            } else {
              console.error(color(C.red, String(err)));
            }
          }
        }
        rl.prompt();
      } else {
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
    console.log(color(C.cyan + C.bold, `MamaLang v${VERSION}`));
    console.log(`Node.js ${process.version}`);
  });

// ── mama init ────────────────────────────────────────────────────────────────

program
  .command('init [directory]')
  .description('Scaffold a new MamaLang project')
  .action((dir: string = '.') => {
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
    fs.writeFileSync(
      path.join(target, 'package.json'),
      JSON.stringify(pkgJson, null, 2),
    );

    fs.writeFileSync(
      path.join(target, '.gitignore'),
      'node_modules\n*.js\ndist\n',
    );

    console.log(color(C.green,  '✓ Project created!'));
    console.log(color(C.cyan,   `  cd ${dir !== '.' ? dir : '.'}`));
    console.log(color(C.cyan,   '  mama run hello.mama'));
  });

// ── Error formatter ───────────────────────────────────────────────────────────

function printCompileError(err: unknown): void {
  if (err instanceof CompileError) {
    console.error(color(C.red + C.bold, '✗ Compile Error'));
    console.error(color(C.red, err.message));
  } else {
    console.error(color(C.red, String(err)));
  }
}

// ── REPL eval helper ─────────────────────────────────────────────────────────

async function evalInContext(js: string): Promise<void> {
  const tmpFile = path.join(require('os').tmpdir(), `__mama_repl_${Date.now()}.js`);
  fs.writeFileSync(tmpFile, js);
  try {
    // Clear require cache for repeated evals in the REPL
    delete require.cache[require.resolve(tmpFile)];
    require(tmpFile);
    // Small wait so async IIFE output is flushed before next prompt
    await new Promise(r => setTimeout(r, 150));
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

// ── Parse & run ───────────────────────────────────────────────────────────────

program.parse(process.argv);
