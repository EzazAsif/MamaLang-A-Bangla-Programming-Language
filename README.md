# MamaLang 🇧🇩

## Status

- [x] Scaffold
- [x] Lexer
- [x] Parser + AST
- [x] Code generator
- [ ] CLI
- [ ] VS Code extension

## Try it

```bash
npm install && npm run build
node -e "const {compile}=require('./dist/index.js'); const {js}=compile('mama bolo(\"Hello\")'); console.log(js)"
```
