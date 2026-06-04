/**
 * NexaSphere Prettier Configuration
 *
 * This file configures the formatting rules for Prettier in the NexaSphere repository.
 * We use a JavaScript module file (.prettierrc.js) to allow detailed inline comments
 * explaining the purpose and rationale behind each configured code formatting rule.
 */

module.exports = {
  /**
   * Print Width
   *
   * Specifies the line length that the printer will wrap on.
   * A print width of 100 provides a good balance between modern wide monitors
   * and readability, ensuring code doesn't become too nested or require excessive
   * horizontal scrolling, while giving enough space for descriptive naming.
   */
  printWidth: 100,

  /**
   * Tab Width
   *
   * Specifies the number of spaces per indentation-level.
   * We enforce 2 spaces to maintain a consistent indent size that keeps code
   * compact, especially in nested JSX/React elements or deeply nested JS blocks.
   */
  tabWidth: 2,

  /**
   * Use Tabs
   *
   * Indent lines with spaces instead of tabs.
   * Spaces are used to ensure the code looks visually identical across all IDEs,
   * text editors, pull request viewers, and terminal environments.
   */
  useTabs: false,

  /**
   * Semicolons
   *
   * Print semicolons at the ends of statements.
   * Enforcing semicolons prevents potential Automatic Semicolon Insertion (ASI) bugs
   * in JavaScript, making statement boundaries explicit and clear.
   */
  semi: true,

  /**
   * Single Quotes
   *
   * Use single quotes instead of double quotes for strings.
   * Single quotes are standard across many JavaScript/TypeScript style guides,
   * making the code cleaner and reducing visual noise compared to double quotes.
   */
  singleQuote: true,

  /**
   * Quote Properties
   *
   * Change when properties in objects are quoted.
   * 'as-needed' only adds quotes around object property names when they contain
   * special characters that require them (like hyphens or spaces). This keeps
   * object declarations neat and standard.
   */
  quoteProps: 'as-needed',

  /**
   * JSX Single Quote
   *
   * Use double quotes instead of single quotes in JSX.
   * Double quotes are standard practice for HTML/JSX attributes, maintaining a
   * clean distinction between JavaScript strings (single quotes) and HTML/JSX
   * attributes (double quotes).
   */
  jsxSingleQuote: false,

  /**
   * Trailing Commas
   *
   * Print trailing commas wherever possible in multi-line comma-separated syntactic structures.
   * 'es5' adds trailing commas in ES5-compatible structures (objects, arrays, etc.),
   * but not in function arguments. This makes git diffs cleaner since adding a new line
   * to an object/array doesn't modify the preceding line to add a comma.
   */
  trailingComma: 'es5',

  /**
   * Bracket Spacing
   *
   * Print spaces between brackets in object literals.
   * e.g., `{ foo: bar }` instead of `{foo: bar}`.
   * This increases readability of objects by adding breathing room around keys and values.
   */
  bracketSpacing: true,

  /**
   * Bracket Same Line
   *
   * Put the `>` of a multi-line HTML/JSX element at the end of the last line,
   * instead of being put alone on the next line.
   * Setting this to false places the closing bracket on a new line, which makes
   * tag structures easier to read and scan vertically.
   */
  bracketSameLine: false,

  /**
   * Arrow Function Parentheses
   *
   * Include parentheses around a sole arrow function parameter.
   * 'always' ensures that arrow functions like `(x) => x` consistently have
   * parentheses, which simplifies adding TypeScript types or adding additional
   * parameters later.
   */
  arrowParens: 'always',

  /**
   * End of Line Character
   *
   * Maintain consistent line endings across different operating systems.
   * 'lf' (Line Feed) enforces Unix-style line endings (\n), which avoids git diff
   * noise and mismatch issues when developers collaborate across Windows and macOS/Linux.
   */
  endOfLine: 'lf',

  /**
   * Embedded Language Formatting
   *
   * Control whether Prettier formats code embedded in other files.
   * 'auto' formats code embedded in markdown code blocks if Prettier knows how.
   */
  embeddedLanguageFormatting: 'auto',
};
