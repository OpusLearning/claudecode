import { describe, it, expect } from "vitest";
import { tokenize, stripComments, stripWhitespace, Token } from "../src/tokenizer";

/** Helper: tokenize and drop whitespace for easier assertions. */
function tokenizeCompact(source: string): Token[] {
  return stripWhitespace(tokenize(source));
}

describe("tokenize", () => {
  it("tokenizes an empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("tokenizes a single keyword", () => {
    const tokens = tokenizeCompact("const");
    expect(tokens).toEqual([
      { type: "keyword", value: "const", line: 1, column: 1 },
    ]);
  });

  it("tokenizes an identifier", () => {
    const tokens = tokenizeCompact("foo");
    expect(tokens).toEqual([
      { type: "identifier", value: "foo", line: 1, column: 1 },
    ]);
  });

  it("distinguishes keywords from identifiers", () => {
    const tokens = tokenizeCompact("let x");
    expect(tokens[0].type).toBe("keyword");
    expect(tokens[1].type).toBe("identifier");
  });

  it("tokenizes integer numbers", () => {
    const tokens = tokenizeCompact("42");
    expect(tokens).toEqual([
      { type: "number", value: "42", line: 1, column: 1 },
    ]);
  });

  it("tokenizes floating point numbers", () => {
    const tokens = tokenizeCompact("3.14");
    expect(tokens).toEqual([
      { type: "number", value: "3.14", line: 1, column: 1 },
    ]);
  });

  it("tokenizes single-quoted strings", () => {
    const tokens = tokenizeCompact("'hello'");
    expect(tokens).toEqual([
      { type: "string", value: "'hello'", line: 1, column: 1 },
    ]);
  });

  it("tokenizes double-quoted strings", () => {
    const tokens = tokenizeCompact('"world"');
    expect(tokens).toEqual([
      { type: "string", value: '"world"', line: 1, column: 1 },
    ]);
  });

  it("handles escape sequences in strings", () => {
    const tokens = tokenizeCompact('"say \\"hi\\""');
    expect(tokens[0].type).toBe("string");
    expect(tokens[0].value).toBe('"say \\"hi\\""');
  });

  it("tokenizes single-char operators", () => {
    const tokens = tokenizeCompact("+ - * /");
    const ops = tokens.map((t) => t.value);
    expect(ops).toEqual(["+", "-", "*", "/"]);
    tokens.forEach((t) => expect(t.type).toBe("operator"));
  });

  it("tokenizes multi-char operators", () => {
    const tokens = tokenizeCompact("== != <= >= && ||");
    const ops = tokens.map((t) => t.value);
    expect(ops).toEqual(["==", "!=", "<=", ">=", "&&", "||"]);
  });

  it("tokenizes punctuation", () => {
    const tokens = tokenizeCompact("(){}[];,.");
    const vals = tokens.map((t) => t.value);
    expect(vals).toEqual(["(", ")", "{", "}", "[", "]", ";", ",", "."]);
    tokens.forEach((t) => expect(t.type).toBe("punctuation"));
  });

  it("tokenizes a single-line comment", () => {
    const tokens = tokenize("// this is a comment");
    expect(tokens).toEqual([
      { type: "comment", value: "// this is a comment", line: 1, column: 1 },
    ]);
  });

  it("tracks line numbers across newlines", () => {
    const tokens = tokenizeCompact("a\nb\nc");
    expect(tokens[0]).toMatchObject({ value: "a", line: 1 });
    expect(tokens[1]).toMatchObject({ value: "b", line: 2 });
    expect(tokens[2]).toMatchObject({ value: "c", line: 3 });
  });

  it("tokenizes a realistic expression", () => {
    const tokens = tokenizeCompact("const x = 10 + 20;");
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      "keyword",      // const
      "identifier",   // x
      "operator",     // =
      "number",       // 10
      "operator",     // +
      "number",       // 20
      "punctuation",  // ;
    ]);
  });

  it("tokenizes a function declaration", () => {
    const source = "function add(a, b) { return a + b; }";
    const tokens = tokenizeCompact(source);
    const values = tokens.map((t) => t.value);
    expect(values).toEqual([
      "function", "add", "(", "a", ",", "b", ")",
      "{", "return", "a", "+", "b", ";", "}",
    ]);
  });

  describe("keywords", () => {
    it.each(["if", "else", "while", "for", "return", "function", "const", "let", "var"])(
      "recognizes '%s' as a keyword",
      (kw) => {
        const tokens = tokenizeCompact(kw);
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toMatchObject({ type: "keyword", value: kw });
      },
    );

    it("does not treat keyword prefixes as keywords", () => {
      const tokens = tokenizeCompact("iffy constant letter");
      tokens.forEach((t) => expect(t.type).toBe("identifier"));
    });

    it("does not treat keyword suffixes as keywords", () => {
      const tokens = tokenizeCompact("returnValue forEach");
      tokens.forEach((t) => expect(t.type).toBe("identifier"));
    });
  });

  describe("identifiers", () => {
    it("handles underscore-prefixed identifiers", () => {
      const tokens = tokenizeCompact("_private __dunder");
      expect(tokens[0]).toMatchObject({ type: "identifier", value: "_private" });
      expect(tokens[1]).toMatchObject({ type: "identifier", value: "__dunder" });
    });

    it("handles identifiers with digits", () => {
      const tokens = tokenizeCompact("x1 foo123 a2b3c");
      expect(tokens).toHaveLength(3);
      tokens.forEach((t) => expect(t.type).toBe("identifier"));
      expect(tokens.map((t) => t.value)).toEqual(["x1", "foo123", "a2b3c"]);
    });

    it("handles uppercase and mixed-case identifiers", () => {
      const tokens = tokenizeCompact("Foo camelCase PascalCase SCREAMING_CASE");
      expect(tokens).toHaveLength(4);
      tokens.forEach((t) => expect(t.type).toBe("identifier"));
    });

    it("handles single-character identifiers", () => {
      const tokens = tokenizeCompact("a b c _ x");
      expect(tokens).toHaveLength(5);
      tokens.forEach((t) => expect(t.type).toBe("identifier"));
    });
  });

  describe("numbers", () => {
    it("tokenizes zero", () => {
      const tokens = tokenizeCompact("0");
      expect(tokens[0]).toMatchObject({ type: "number", value: "0" });
    });

    it("tokenizes large numbers", () => {
      const tokens = tokenizeCompact("9999999");
      expect(tokens[0]).toMatchObject({ type: "number", value: "9999999" });
    });

    it("tokenizes consecutive numbers separated by operators", () => {
      const tokens = tokenizeCompact("1+2*3");
      expect(tokens.map((t) => t.value)).toEqual(["1", "+", "2", "*", "3"]);
      expect(tokens.map((t) => t.type)).toEqual([
        "number", "operator", "number", "operator", "number",
      ]);
    });
  });

  describe("strings", () => {
    it("tokenizes empty strings", () => {
      const tokens = tokenizeCompact('""');
      expect(tokens[0]).toMatchObject({ type: "string", value: '""' });
    });

    it("tokenizes empty single-quoted strings", () => {
      const tokens = tokenizeCompact("''");
      expect(tokens[0]).toMatchObject({ type: "string", value: "''" });
    });

    it("handles escaped backslash in strings", () => {
      const tokens = tokenizeCompact('"foo\\\\bar"');
      expect(tokens[0].type).toBe("string");
      expect(tokens[0].value).toBe('"foo\\\\bar"');
    });

    it("handles strings with escaped newline", () => {
      const tokens = tokenizeCompact('"line1\\nline2"');
      expect(tokens[0].type).toBe("string");
    });

    it("tokenizes adjacent strings", () => {
      const tokens = tokenizeCompact('"a""b"');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: "string", value: '"a"' });
      expect(tokens[1]).toMatchObject({ type: "string", value: '"b"' });
    });
  });

  describe("operators", () => {
    it("tokenizes division as operator, not comment start", () => {
      const tokens = tokenizeCompact("a / b");
      expect(tokens[1]).toMatchObject({ type: "operator", value: "/" });
    });

    it("distinguishes = from ==", () => {
      const tokens = tokenizeCompact("a = b == c");
      expect(tokens[1]).toMatchObject({ type: "operator", value: "=" });
      expect(tokens[3]).toMatchObject({ type: "operator", value: "==" });
    });

    it("distinguishes < from <=", () => {
      const tokens = tokenizeCompact("a < b <= c");
      expect(tokens[1]).toMatchObject({ type: "operator", value: "<" });
      expect(tokens[3]).toMatchObject({ type: "operator", value: "<=" });
    });

    it("distinguishes > from >=", () => {
      const tokens = tokenizeCompact("a > b >= c");
      expect(tokens[1]).toMatchObject({ type: "operator", value: ">" });
      expect(tokens[3]).toMatchObject({ type: "operator", value: ">=" });
    });

    it("handles operator at end of input", () => {
      const tokens = tokenizeCompact("x +");
      expect(tokens[1]).toMatchObject({ type: "operator", value: "+" });
    });

    it("tokenizes operators without surrounding spaces", () => {
      const tokens = tokenizeCompact("a+b");
      expect(tokens.map((t) => t.value)).toEqual(["a", "+", "b"]);
    });
  });

  describe("comments", () => {
    it("handles comment after code on the same line", () => {
      const tokens = tokenize("x = 1 // assign");
      const comment = tokens.find((t) => t.type === "comment");
      expect(comment).toBeDefined();
      expect(comment!.value).toBe("// assign");
    });

    it("handles multiple comment lines", () => {
      const tokens = tokenize("// first\n// second");
      const comments = tokens.filter((t) => t.type === "comment");
      expect(comments).toHaveLength(2);
      expect(comments[0].value).toBe("// first");
      expect(comments[1].value).toBe("// second");
    });

    it("handles empty comment", () => {
      const tokens = tokenize("//");
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({ type: "comment", value: "//" });
    });
  });

  describe("column tracking", () => {
    it("tracks columns for tokens on the same line", () => {
      const tokens = tokenizeCompact("ab cd");
      expect(tokens[0]).toMatchObject({ value: "ab", column: 1 });
      expect(tokens[1]).toMatchObject({ value: "cd", column: 4 });
    });

    it("resets column after newline", () => {
      const tokens = tokenizeCompact("ab\ncd");
      expect(tokens[0]).toMatchObject({ value: "ab", line: 1, column: 1 });
      expect(tokens[1]).toMatchObject({ value: "cd", line: 2, column: 1 });
    });

    it("tracks columns through operators and punctuation", () => {
      const tokens = tokenizeCompact("a(b)");
      expect(tokens[0]).toMatchObject({ value: "a", column: 1 });
      expect(tokens[1]).toMatchObject({ value: "(", column: 2 });
      expect(tokens[2]).toMatchObject({ value: "b", column: 3 });
      expect(tokens[3]).toMatchObject({ value: ")", column: 4 });
    });
  });

  describe("whitespace handling", () => {
    it("tokenizes whitespace-only input", () => {
      const tokens = tokenize("   ");
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe("whitespace");
    });

    it("tokenizes tabs as whitespace", () => {
      const tokens = tokenize("\t");
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe("whitespace");
    });

    it("groups consecutive whitespace into one token", () => {
      const tokens = tokenize("a   b");
      const ws = tokens.filter((t) => t.type === "whitespace");
      expect(ws).toHaveLength(1);
      expect(ws[0].value).toBe("   ");
    });

    it("handles mixed newlines and spaces", () => {
      const tokens = tokenize("a\n  b");
      const ws = tokens.filter((t) => t.type === "whitespace");
      expect(ws).toHaveLength(1);
      expect(ws[0].value).toBe("\n  ");
    });
  });

  describe("unknown characters", () => {
    it("skips unknown characters silently", () => {
      const tokens = tokenizeCompact("a @ b");
      expect(tokens.map((t) => t.value)).toEqual(["a", "b"]);
    });

    it("skips multiple unknown characters", () => {
      const tokens = tokenizeCompact("~#$%^");
      expect(tokens).toHaveLength(0);
    });

    it("preserves valid tokens around unknown characters", () => {
      const tokens = tokenizeCompact("x ^ y");
      expect(tokens.map((t) => t.value)).toEqual(["x", "y"]);
    });
  });

  describe("roundtrip integrity", () => {
    it.each([
      "const x = 42;",
      "function foo(a, b) { return a + b; }",
      "if (x == 1) { y = 2; } else { y = 3; }",
      "// comment\nlet z = 'hello';",
      "a <= b && c >= d || e != f",
      "",
    ])("concatenated tokens reconstruct the source: %s", (source) => {
      const tokens = tokenize(source);
      const reconstructed = tokens.map((t) => t.value).join("");
      expect(reconstructed).toBe(source);
    });
  });

  describe("complex programs", () => {
    it("tokenizes an if/else block", () => {
      const source = "if (a == b) { return a; } else { return b; }";
      const tokens = tokenizeCompact(source);
      const values = tokens.map((t) => t.value);
      expect(values).toEqual([
        "if", "(", "a", "==", "b", ")", "{", "return", "a", ";", "}",
        "else", "{", "return", "b", ";", "}",
      ]);
    });

    it("tokenizes a while loop", () => {
      const source = "while (x > 0) { x = x - 1; }";
      const tokens = tokenizeCompact(source);
      const values = tokens.map((t) => t.value);
      expect(values).toEqual([
        "while", "(", "x", ">", "0", ")", "{",
        "x", "=", "x", "-", "1", ";", "}",
      ]);
    });

    it("tokenizes nested expressions", () => {
      const source = "(a + (b * c))";
      const tokens = tokenizeCompact(source);
      const values = tokens.map((t) => t.value);
      expect(values).toEqual(["(", "a", "+", "(", "b", "*", "c", ")", ")"]);
    });

    it("tokenizes a for loop", () => {
      const source = "for (var i = 0; i < 10; i = i + 1) {}";
      const tokens = tokenizeCompact(source);
      expect(tokens[0]).toMatchObject({ type: "keyword", value: "for" });
      expect(tokens.filter((t) => t.type === "keyword").map((t) => t.value)).toEqual(["for", "var"]);
    });

    it("tokenizes a multi-line program", () => {
      const source = [
        "const a = 1;",
        "const b = 2;",
        "const c = a + b;",
      ].join("\n");
      const tokens = tokenizeCompact(source);
      const consts = tokens.filter((t) => t.value === "const");
      expect(consts).toHaveLength(3);
      expect(consts[0].line).toBe(1);
      expect(consts[1].line).toBe(2);
      expect(consts[2].line).toBe(3);
    });

    it("tokenizes string assignment with comment", () => {
      const source = 'let name = "alice"; // user name';
      const tokens = tokenize(source);
      const types = new Set(tokens.map((t) => t.type));
      expect(types).toContain("keyword");
      expect(types).toContain("identifier");
      expect(types).toContain("operator");
      expect(types).toContain("string");
      expect(types).toContain("comment");
      expect(types).toContain("punctuation");
      expect(types).toContain("whitespace");
    });
  });
});

describe("stripComments", () => {
  it("removes comment tokens", () => {
    const tokens = tokenize("x // comment\ny");
    const stripped = stripComments(tokens);
    expect(stripped.find((t) => t.type === "comment")).toBeUndefined();
  });

  it("preserves non-comment tokens", () => {
    const tokens = tokenize("x // comment\ny");
    const stripped = stripComments(stripWhitespace(tokens));
    expect(stripped.map((t) => t.value)).toEqual(["x", "y"]);
  });

  it("returns all tokens when there are no comments", () => {
    const tokens = tokenize("let x = 1;");
    const stripped = stripComments(tokens);
    expect(stripped).toEqual(tokens);
  });

  it("handles empty token array", () => {
    expect(stripComments([])).toEqual([]);
  });
});

describe("stripWhitespace", () => {
  it("removes whitespace tokens", () => {
    const tokens = tokenize("a  b");
    const stripped = stripWhitespace(tokens);
    expect(stripped.find((t) => t.type === "whitespace")).toBeUndefined();
    expect(stripped.map((t) => t.value)).toEqual(["a", "b"]);
  });

  it("returns all tokens when there is no whitespace", () => {
    const tokens = tokenize("a+b");
    const stripped = stripWhitespace(tokens);
    expect(stripped).toEqual(tokens);
  });

  it("handles empty token array", () => {
    expect(stripWhitespace([])).toEqual([]);
  });

  it("removes newline-containing whitespace", () => {
    const tokens = tokenize("a\n\nb");
    const stripped = stripWhitespace(tokens);
    expect(stripped).toHaveLength(2);
    expect(stripped.map((t) => t.value)).toEqual(["a", "b"]);
  });
});
