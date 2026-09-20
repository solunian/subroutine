import Decimal from "decimal.js";

type Operator = "+" | "-" | "*" | "/" | "u-";

const PRECEDENCE: Record<Operator, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "u-": 3,
};

// Shunting-Yard Algorithm Evaluator
export function eval_math(expr: string | number): number | null {
  if (typeof expr === "number") {
    return expr;
  }

  const nums: Decimal[] = [];
  const ops: (Operator | "(")[] = [];

  const n = expr.length;
  let i = 0;

  // True if the next token must begin an operand.
  // An operand may be a number, unary -, or "(".
  let expectOperand = true;

  function apply(): boolean {
    const op = ops.pop();

    if (!op || op === "(") return false;

    if (nums.length < (op === "u-" ? 1 : 2)) {
      return false;
    }

    if (op === "u-") {
      nums.push(nums.pop()!.negated());
      return true;
    }

    const b = nums.pop()!;
    const a = nums.pop()!;

    let result: Decimal;

    switch (op) {
      case "+":
        result = a.plus(b);
        break;
      case "-":
        result = a.minus(b);
        break;
      case "*":
        result = a.times(b);
        break;
      case "/":
        if (b.isZero()) return false;
        result = a.dividedBy(b);
        break;
    }

    if (!result.isFinite()) return false;

    nums.push(result);
    return true;
  }

  while (i < n) {
    const ch = expr[i];

    // Skip whitespace.
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Parse a number.
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      if (!expectOperand) return null;

      const start = i;
      let hasDigit = false;
      let hasDot = false;

      while (i < n) {
        const c = expr[i];

        if (c >= "0" && c <= "9") {
          hasDigit = true;
        } else if (c === "." && !hasDot) {
          hasDot = true;
        } else {
          break;
        }

        i++;
      }

      if (!hasDigit) return null;

      const value = new Decimal(expr.slice(start, i));

      nums.push(value);
      expectOperand = false;
      continue;
    }

    // Opening parenthesis.
    if (ch === "(") {
      if (!expectOperand) return null;

      ops.push("(");
      expectOperand = true;
      i++;
      continue;
    }

    // Closing parenthesis.
    if (ch === ")") {
      if (expectOperand) return null;

      while (ops.length && ops[ops.length - 1] !== "(") {
        if (!apply()) return null;
      }

      if (ops.length === 0) return null;

      ops.pop(); // Remove "(".

      expectOperand = false;
      i++;
      continue;
    }

    // Binary operators and unary minus.
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      if (expectOperand) {
        // Only unary minus is supported.
        if (ch !== "-") return null;

        // Unary minus is right-associative.
        // Push without popping existing operators.
        ops.push("u-");

        i++;
        continue;
      }

      const op = ch as Operator;

      // Binary operators are left-associative.
      while (ops.length) {
        const top = ops[ops.length - 1];

        if (top === "(") break;

        if (PRECEDENCE[top] < PRECEDENCE[op]) {
          break;
        }

        if (!apply()) return null;
      }

      ops.push(op);
      expectOperand = true;
      i++;
      continue;
    }

    // Unknown character.
    return null;
  }

  // An expression cannot end with an operator.
  if (expectOperand) return null;

  // Evaluate remaining operators.
  while (ops.length) {
    if (ops[ops.length - 1] === "(") return null;

    if (!apply()) return null;
  }

  if (nums.length !== 1) return null;

  const result = nums[0].toNumber();

  return Number.isFinite(result) ? result : null;
}
