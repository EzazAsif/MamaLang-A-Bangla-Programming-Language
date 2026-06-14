/**
 * MamaLang VS Code Extension
 *
 * Provides:
 * - Run current file (mama run)
 * - Compile current file (mama compile)
 * - Error diagnostics from compiler output
 */

import * as vscode from 'vscode';
import * as cp     from 'child_process';
import * as path   from 'path';

let diagnosticCollection: vscode.DiagnosticCollection;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('mamalang');
  outputChannel = vscode.window.createOutputChannel('MamaLang');

  context.subscriptions.push(diagnosticCollection);
  context.subscriptions.push(outputChannel);

  // ── Commands ──────────────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand('mamalang.run', () => runFile()),
    vscode.commands.registerCommand('mamalang.compile', () => compileFile()),
  );

  // ── Auto-diagnostics on save ──────────────────────────────────────────────

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId === 'mamalang') {
        lintFile(doc.fileName);
      }
    }),
  );

  vscode.window.showInformationMessage('MamaLang activated! 🇧🇩');
}

export function deactivate(): void {
  diagnosticCollection.dispose();
  outputChannel.dispose();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMamaBin(): string {
  return vscode.workspace
    .getConfiguration('mamalang')
    .get<string>('executablePath', 'mama');
}

function runFile(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const file = editor.document.fileName;
  if (!file.endsWith('.mama')) {
    vscode.window.showWarningMessage('Open a .mama file first!');
    return;
  }
  editor.document.save().then(() => {
    const terminal = vscode.window.createTerminal('MamaLang');
    terminal.show();
    terminal.sendText(`${getMamaBin()} run "${file}"`);
  });
}

function compileFile(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const file = editor.document.fileName;
  if (!file.endsWith('.mama')) {
    vscode.window.showWarningMessage('Open a .mama file first!');
    return;
  }
  editor.document.save().then(() => {
    cp.exec(`${getMamaBin()} compile "${file}"`, (err, stdout, stderr) => {
      outputChannel.clear();
      outputChannel.show();
      if (err) {
        outputChannel.appendLine('✗ Compile failed:\n' + (stderr || err.message));
        parseDiagnostics(file, stderr || err.message);
      } else {
        outputChannel.appendLine(stdout || '✓ Compiled successfully');
        diagnosticCollection.set(vscode.Uri.file(file), []);
      }
    });
  });
}

function lintFile(filePath: string): void {
  cp.exec(`${getMamaBin()} compile "${filePath}"`, (_err, _stdout, stderr) => {
    if (stderr) {
      parseDiagnostics(filePath, stderr);
    } else {
      diagnosticCollection.set(vscode.Uri.file(filePath), []);
    }
  });
}

/** Parse compiler error output and push VS Code diagnostics. */
function parseDiagnostics(filePath: string, output: string): void {
  const diagnostics: vscode.Diagnostic[] = [];

  // Pattern: "Line 5:10 – unexpected token"
  const linePattern = /Line (\d+):(\d+)\s*[–-]\s*(.+)/g;
  let match: RegExpExecArray | null;

  while ((match = linePattern.exec(output)) !== null) {
    const line   = parseInt(match[1], 10) - 1; // VS Code is 0-indexed
    const col    = parseInt(match[2], 10) - 1;
    const msg    = match[3].trim();
    const range  = new vscode.Range(line, col, line, col + 10);
    diagnostics.push(new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Error));
  }

  diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);
}
