# TSM-6: Simplifying Lisp with Homoiconic C — All You Need is FOLD

Lisp has long been revered as the Platonic ideal of programming languages, its
minimalist design where code and data share the same structure—lists—grants Lisp
unmatched power and flexibility. But for all its elegance, Lisp’s strength also
breeds complexity. Despite its simple syntax and aversion to assignment, Lisp
still relies on a variety of special forms—like `define`, `lambda`, `if`,
`cond`, `quote`, and `eval`. These forms, though essential, break the uniformity
of Lisp’s structure, requiring specialized handling and evaluation rules.

What if we could capture the essence of Lisp without its complications? Enter
**Homoiconic C (HC)**, a language that reimagines Lisp’s core principles while
shedding its complexities. HC leverages a minimalist, trivially parseable syntax
and consistent evaluation rules to create a fully homoiconic language.
Everything in HC—whether data, functions, or operators—follows a single unified
model. By focusing on **properties**, **closures**, **reduce (fold)**, and
**ternary logic**, HC simplifies the complexity of Lisp while enhancing its
power and flexibility.

---

## The HC Evaluation Model

HC operates on a simple yet powerful evaluation model that ensures consistency
across the language by applying a few core principles:

### 1. **Everything (except terminals) is an identifier**

In HC, any element that isn't a terminal (like numbers or strings) is treated as
an **identifier**. Identifiers form the backbone of expressions, and their
meaning is determined by the **context** in which they are evaluated.

### 2. **Identifiers are evaluated in context to create frames**

Identifiers are evaluated within a **context** to produce **frames**. Frames
encapsulate both values and behaviors, making identifiers in HC more powerful
than traditional variables.

### 3. **Frames are evaluated left to right to create new frames**

In HC, **evaluation** is the core operation. Frames are combined through
left-to-right evaluation, with each step producing a new frame. This uniform
approach eliminates the need for special forms like `eval`—all expressions
follow the same straightforward rules.

This model also extends to how HC handles traditionally complex operations like
variable assignment, function creation, and control flow, all of which are
simplified and unified.

---

## Unifying Lisp’s Special Forms with HC

Lisp relies on special forms to handle tasks like variable assignment, control
flow, and function definitions. HC unifies these tasks through a consistent set
of operations, removing the need for specialized keywords or forms. Let’s
explore how HC reimagines these constructs.

### 1. **Properties: Replacing `define`, `set!`, and `let`**

In Lisp, the management of variables and scope often requires forms like
`define`, `set!`, and `let`. HC simplifies this with **properties** (denoted by
`.prop`). Properties handle all forms of **variable binding** and **assignment**
directly within the current context, eliminating the need for special forms.

- **Lisp**:
  ```scheme
  (define x 10)
  (set! x 20)
  (let ((y 20)) (+ y 10))
  ```

- **HC**:
  ```
  .x 10
  .x 20
  [.y 20; y + 10]
  ```

HC properties are evaluated in context and interact seamlessly with **actions**,
**context**, and **effects**, offering a more intuitive and flexible approach
than Lisp’s variable bindings.

---

### 2. **Closures: Replacing `lambda`, `quote`, and `eval`**

Lisp’s `lambda` creates anonymous functions, `quote` prevents evaluation, and
`eval` dynamically evaluates code. In HC, **closures** (`{}`) consolidate these
tasks into a single, powerful construct. This eliminates the need for distinct
forms like `lambda`, `quote`, and `eval`, simplifying the language while
maintaining its expressiveness.

- **Lisp**:
  ```scheme
  (lambda (x) (* x x))
  (quote (+ 1 2))
  (eval '(+ 1 2))
  ```

- **HC**:
  ```
  .square {_ * _}
  {1 + 2}
  {1 + 2} ()
  ```

#### **How Closures Work in HC**

HC closures can:

- Be defined with parameters, functioning like `lambda`.
- Defer evaluation until explicitly called, replacing the need for `quote`.
- Dynamically evaluate deferred expressions when invoked, as with `eval`.

This unified use of closures allows HC to handle function creation, deferred
evaluation, and dynamic computation consistently and simply.

---

### 3. **Reduce and Ternary Logic: Replacing `if`, `cond`, and `case`**

Conditional logic in HC is managed through **ternary-style operators** (`?:`),
which replace Lisp’s `if`, `cond`, and `case`. This approach integrates
branching decisions directly into the evaluation process, avoiding the need for
separate forms or special rules.

Moreover, **reduce (fold)**—denoted by `|`—is the cornerstone operation in HC,
applied to all expressions. Reduce folds over expressions from left to right,
ensuring consistent evaluation. This not only eliminates the need for forms like
`do`, but also ensures that **operators** follow the same evaluation rules as
everything else in the language.

- **Lisp**:
  ```scheme
  (if (> x 10) "large" "small")
  (cond ((> x 10) "large") ((< x 5) "small") (else "medium"))
  (case x ((1) "one") ((2) "two") (else "other"))
  ```

- **HC**:
  ```
  x > 10 ? "large" : "small"
  [x > 10 ? "large", x < 5 ? "small", "medium"]
  [x = 1 ? "one", x = 2 ? "two", "other"]
  ```

#### **How Binary Operators Work in HC**

HC treats binary operators as integral parts of the **evaluation process**.
Operators like `|` (reduce), `?` (then), and `:` (else) are symbols evaluated
within context, adhering to the same rules as any other expression.

- **`|` (Reduce)**: Folds expressions from left to right, similar to a reduce
  function or loop.
- **`?` (Then)**: Functions as a ternary `if` operator, evaluating the first
  condition.
- **`:` (Else)**: Completes the ternary operation by providing an alternative if
  the `then` condition is false.

This consistent handling of operators as part of the standard evaluation process
ensures that HC remains both powerful and easy to reason about.

---

## Conclusion: Simplifying Homoiconicity with FOLD

Lisp’s reliance on special forms creates inherent complexity, but **Homoiconic C
(HC)** offers a more streamlined alternative. By eliminating the need for these
forms, HC achieves simplicity through its minimal syntax, where everything is an
identifier and expressions are evaluated via a consistent folding process.

By unifying **properties**, **closures**, **reduce**, and **ternary operators**,
HC replaces Lisp’s special forms like `define`, `lambda`, `if`, and `eval` with
a more straightforward, flexible language model. All binary operators follow the
same evaluation rules, making the language easier to parse and reason about,
while also remaining fully homoiconic.

Ultimately, **all you need is FOLD**—and a few well-designed core constructs—to
unlock a more powerful, elegant, and flexible approach to computing.
