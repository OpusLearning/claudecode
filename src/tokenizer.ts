export type TokenType =
  | "keyword"
  | "identifier"
  | "number"
  | "string"
  | "operator"
  | "punctuation"
  | "whitespace"
  | "comment";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  "if",
  "else",
  "while",
  "for",
  "return",
  "function",
  "const",
  "let",
  "var",
]);

const OPERATORS = new Set([
  "+",
  "-",
  "*",
  "/",
  "=",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
]);

const PUNCTUATION = new Set(["(", ")", "{", "}", "[", "]", ";", ",", "."]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;

  while (pos < source.length) {
    const char = source[pos];

    // Whitespace
    if (/\s/.test(char)) {
      const start = pos;
      while (pos < source.length && /\s/.test(source[pos])) {
        if (source[pos] === "\n") {
          line++;
          column = 1;
        } else {
          column++;
        }
        pos++;
      }
      tokens.push({
        type: "whitespace",
        value: source.slice(start, pos),
        line,
        column: column - (pos - start),
      });
      continue;
    }

    // Single-line comment
    if (char === "/" && source[pos + 1] === "/") {
      const start = pos;
      const startCol = column;
      while (pos < source.length && source[pos] !== "\n") {
        pos++;
        column++;
      }
      tokens.push({
        type: "comment",
        value: source.slice(start, pos),
        line,
        column: startCol,
      });
      continue;
    }

    // String
    if (char === '"' || char === "'") {
      const quote = char;
      const start = pos;
      const startCol = column;
      pos++;
      column++;
      while (pos < source.length && source[pos] !== quote) {
        if (source[pos] === "\\") {
          pos++;
          column++;
        }
        pos++;
        column++;
      }
      pos++; // closing quote
      column++;
      tokens.push({
        type: "string",
        value: source.slice(start, pos),
        line,
        column: startCol,
      });
      continue;
    }

    // Number
    if (/[0-9]/.test(char)) {
      const start = pos;
      const startCol = column;
      while (pos < source.length && /[0-9.]/.test(source[pos])) {
        pos++;
        column++;
      }
      tokens.push({
        type: "number",
        value: source.slice(start, pos),
        line,
        column: startCol,
      });
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(char)) {
      const start = pos;
      const startCol = column;
      while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) {
        pos++;
        column++;
      }
      const value = source.slice(start, pos);
      tokens.push({
        type: KEYWORDS.has(value) ? "keyword" : "identifier",
        value,
        line,
        column: startCol,
      });
      continue;
    }

    // Multi-char operators
    if (pos + 1 < source.length) {
      const twoChar = source.slice(pos, pos + 2);
      if (OPERATORS.has(twoChar)) {
        tokens.push({ type: "operator", value: twoChar, line, column });
        pos += 2;
        column += 2;
        continue;
      }
    }

    // Single-char operator
    if (OPERATORS.has(char)) {
      tokens.push({ type: "operator", value: char, line, column });
      pos++;
      column++;
      continue;
    }

    // Punctuation
    if (PUNCTUATION.has(char)) {
      tokens.push({ type: "punctuation", value: char, line, column });
      pos++;
      column++;
      continue;
    }

    // Unknown character — skip
    pos++;
    column++;
  }

  return tokens;
}

export function stripComments(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.type !== "comment");
}

export function stripWhitespace(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.type !== "whitespace");
}
