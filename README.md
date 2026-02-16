# claudecode

A simple code tokenizer written in TypeScript. Breaks source code strings into typed tokens: keywords, identifiers, numbers, strings, operators, punctuation, comments, and whitespace.

## Install

```bash
npm install
```

## Usage

```typescript
import { tokenize, stripComments, stripWhitespace } from "./src/tokenizer";

const tokens = tokenize("const x = 42;");
// [
//   { type: "keyword",     value: "const", line: 1, column: 1 },
//   { type: "whitespace",  value: " ",     line: 1, column: 6 },
//   { type: "identifier",  value: "x",     line: 1, column: 7 },
//   { type: "whitespace",  value: " ",     line: 1, column: 8 },
//   { type: "operator",    value: "=",     line: 1, column: 9 },
//   { type: "whitespace",  value: " ",     line: 1, column: 10 },
//   { type: "number",      value: "42",    line: 1, column: 11 },
//   { type: "punctuation", value: ";",     line: 1, column: 13 },
// ]

// Filter out noise
const meaningful = stripWhitespace(stripComments(tokens));
```

## API

### `tokenize(source: string): Token[]`

Tokenizes a source string into an array of tokens. Each token has:

- `type` — one of `keyword`, `identifier`, `number`, `string`, `operator`, `punctuation`, `whitespace`, `comment`
- `value` — the raw text
- `line` — 1-based line number
- `column` — 1-based column number

### `stripComments(tokens: Token[]): Token[]`

Returns a new array with comment tokens removed.

### `stripWhitespace(tokens: Token[]): Token[]`

Returns a new array with whitespace tokens removed.

## Supported syntax

| Token type | Examples |
|---|---|
| Keywords | `if`, `else`, `while`, `for`, `return`, `function`, `const`, `let`, `var` |
| Identifiers | `foo`, `_private`, `camelCase`, `x1` |
| Numbers | `0`, `42`, `3.14` |
| Strings | `"hello"`, `'world'`, `"escaped \"quote\""` |
| Operators | `+`, `-`, `*`, `/`, `=`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `\|\|` |
| Punctuation | `(`, `)`, `{`, `}`, `[`, `]`, `;`, `,`, `.` |
| Comments | `// single-line comments` |

## Test

```bash
npm test
```

78 tests covering all token types, edge cases, column/line tracking, roundtrip integrity, and complex programs.
