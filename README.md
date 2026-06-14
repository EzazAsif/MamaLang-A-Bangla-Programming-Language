# 🇧🇩 MamaLang

> A Bengali meme-style programming language that compiles to JavaScript.

[![npm version](https://badge.fury.io/js/mamalang.svg)](https://badge.fury.io/js/mamalang)
[![CI](https://github.com/mamalang/mamalang/actions/workflows/ci.yml/badge.svg)](https://github.com/mamalang/mamalang/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is MamaLang?

MamaLang is a humorous programming language where every keyword starts with **"mama"** — inspired by Bangladeshi meme culture. It transpiles to clean JavaScript and runs on Node.js.

```mama
mama bolo("Assalamu Alaikum, Duniya! 🌍")

mama dhori boyosh = 20

mama jodi (boyosh >= 18) {
    mama bolo("Tumi boro!")
} mama nahole {
    mama bolo("Tumi choto!")
}
```

---

## Installation

```bash
npm install -g mamalang
```

---

## Quick Start

Create `hello.mama`:

```mama
mama bolo("Hello from MamaLang!")
mama hasi()
```

Run it:

```bash
mama run hello.mama
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `mama run <file>` | Compile and run a `.mama` file |
| `mama compile <file>` | Compile to JavaScript only |
| `mama repl` | Start interactive REPL |
| `mama init [dir]` | Scaffold a new project |
| `mama version` | Print version |

---

## Language Reference

### Variables

```mama
mama dhori x = 10          // let x = 10
mama pakka PI = 3.1416     // const PI = 3.1416
```

### Print

```mama
mama bolo("Hello!")        // console.log("Hello!")
mama bolo(x, y, z)         // console.log(x, y, z)
```

### Conditionals

```mama
mama jodi (x > 5) {
    mama bolo("boro")
} mama nahole {
    mama bolo("choto")
}
```

### Loops

```mama
// For loop
mama ghuro (mama dhori i = 0; i < 10; i++) {
    mama bolo(i)
}

// While loop
mama jotokkhon (x < 100) {
    x += 1
}
```

### Functions

```mama
mama kaj jog(a, b) {
    mama ferot a + b
}

mama bolo(jog(3, 4))   // 7
```

### Async / Await

```mama
mama kaj fetchData() {
    mama dhori result = mama opekkha getData()
    mama ferot result
}
```

### Booleans & Null

```mama
mama dhori isReady = mama shotto    // true
mama dhori isEmpty = mama miththa   // false
mama dhori value = mama khali       // null
```

### Try / Catch

```mama
mama panic {
    riskyOperation()
} mama dhora(err) {
    mama bolo("Error hoiche: " + err)
}
```

### Meme Features

```mama
mama hasi()          // console.log("😂")
mama kanna()         // console.log("😭")
mama ghum(2000)      // await sleep(2000ms)
```

### Runtime Helpers

```mama
mama dhori r = mama.random()     // Math.random()
mama dhori t = mama.time()       // Date.now()
mama dhori d = mama.tarikh()     // new Date()
```

---

## Examples

### Fibonacci

```mama
mama kaj fib(n) {
    mama jodi (n <= 1) { mama ferot n }
    mama ferot fib(n - 1) + fib(n - 2)
}

mama ghuro (mama dhori i = 0; i < 10; i++) {
    mama bolo("fib(" + i + ") = " + fib(i))
}
```

### Calculator

```mama
mama kaj bhag(a, b) {
    mama jodi (b === 0) {
        mama bolo("Shunno diye bhag hoy na!")
        mama ferot mama khali
    }
    mama ferot a / b
}
```

---

## VS Code Extension

Install **MamaLang Language Support** from the VS Code Marketplace.

Features:
- ✅ Syntax highlighting
- ✅ Snippets (type `mj` → `mama jodi`, `mk` → `mama kaj`, etc.)
- ✅ Run file from editor title bar
- ✅ Error diagnostics
- ✅ Auto-closing brackets

---

## Architecture

```
src/
├── lexer/
│   ├── tokens.ts       Token types & labels
│   └── lexer.ts        Hand-written tokenizer
├── parser/
│   └── parser.ts       Recursive-descent parser
├── ast/
│   └── nodes.ts        AST node type definitions
├── generator/
│   └── generator.ts    JavaScript code generator
├── cli/
│   └── index.ts        CLI (commander.js)
└── index.ts            Public compiler API
```

### Compilation Pipeline

```
.mama source
     │
     ▼
  Lexer  ──→  Token[]
     │
     ▼
  Parser ──→  AST (Program)
     │
     ▼
Generator ──→  JavaScript string
     │
     ▼
  Node.js executes it
```

---

## Contributing

```bash
git clone https://github.com/mamalang/mamalang
cd mamalang
npm install
npm run dev       # watch mode
npm test          # run tests
```

---

## License

MIT © MamaLang Contributors

---

*Developed with ❤️ and plenty of chai ☕ in Bangladesh 🇧🇩*
