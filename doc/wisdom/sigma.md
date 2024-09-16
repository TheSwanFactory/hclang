# TSM-3: Sigma Calculus and the PEACE Monad

The Sigma Calculus is a formal system for deterministic stateful computation, acting as both a generalization and simplification of the Lambda Calculus. It defines a system of **Monads** and **Symbols** for a computational framework closed under left-to-right evaluation.

## Basic Evaluation Rules

Using 'M' for monads and 'S' for symbols, here are the basic evaluation rules in Sigma Calculus:

```sh
; M M      # Monad applied to Monad returns a Monad.
# M
; M .S     # Monad applied to Symbol returns a Monad.
# M
; .S M     # Symbol applied to Monad returns a Monad.
# M
; .S .S    # Symbol applied to Symbol results in a Symbol or error.
# 
```

These rules demonstrate that Monads always take precedence in computation.

---

## PEACE Monads

In Sigma Calculus, **PEACE Monads** serve as the universal atomic units of computation. Each Monad can exhibit the following attributes:

- **named Properties**: Function like key-value pairs in a dictionary.
- **finite Enumerables**: Behave like arrays or lists.
- **Actions**: Act like functions, methods, or closures when applied to arguments.
- **hierarchical Context**: Provide scoping similar to modules or classes.
- **Effect typing**: Encodes the mutability and state of the Monad.

### Effect Typing

Effect typing syntax, as outlined in [The Fractor Model](https://ihack.us/2024/09/14/the-fractor-model-precise-shared-mutable-state-management-for-systems-programming/), is as follows:

- `lowercase` - Immutable variable.
- `UPPERCASE` - Immutable constant.
- `lowercase!` - Mutable variable.
- `UPPERCASE!` - Mutable constant.
- `lowercase:` - Reassignable mutating method.
- `UPPERCASE:` - Unassignable mutating method.

**Example:**

```sh
; .x! 5      # Declare a mutable variable x!.
# .x! 5

; .x! x 1     # Increment the mutable variable.
# .x! 6

; .Y 10      # Declare an immutable constant Y.
# .Y 10

; .Y 11     # Attempt re-assigment of an immutable constant.
#$ Error: Cannot reassign constant Y.
```

In the example above, `x!` is mutable and can be changed, while `Y` is immutable and causes an error when modified.

---

## Primitive Monads

Sigma Calculus treats grouping constructors and whole numbers as Monads. These Monads are used for structuring and organizing data.

### Examples of Primitive Monads:

```sh
; 1 2 3       # Whole numbers are Monads, which automatically sum
# 6

; [] 1 2      # Array constructor.
# [1, 2]

; () 1        # Nil (false) - the empty expression returns its argument.
# 1

; <> 1        # All (true) - the total type returns true except for nil.
# <>

; <> ()       # All applied to nil returns nil.
# ()

; {} 1        # No-Op - the void closure always returns nil.
# ()
```

### Array Operations

You can treat arrays as Monads and operate on them directly:

```sh
; .arr [1, 2, 3]
# [1, 2, 3]

; arr.0
# 1

; arr.2
# 3

; .arr.1 4  # Modify the second element in the array; returns the new array.
# [1, 4, 3]
```

---

## Symbols

Symbols represent variables, properties, and operations. They are defined by specific naming conventions.

- **Properties**: A letter followed by alphanumeric characters, e.g., `.a`, `.a1`, `.a1b`.
- **Whole Numbers**: Non-negative integers and numeric literals, e.g., `42`, `0b01`, `0xdeadbeef`.
- **Operators**: Non-alphanumeric symbols, e.g., `?`, `&&`, `|`, `<<`.

### Symbol Parsing

A leading `.` in a symbol indicates a **name** (which evaluates to a symbol). Without the leading dot, the symbol is evaluated as a **value** in the current or parent context, and resolves to a Monad.

### Examples:

```sh
; .a 42          # Symbol a is a name that evaluates to 42.
# .a 42

; a                # Evaluates the value of a in context.
# 42

; .b "hello"     # Assign symbol b to the string "hello".
# .b "hello"

; b
# "hello"
```

---

## Nested Symbols

Symbols can have nested properties using dot notation. This allows for creating complex structures of Monads.

### Examples of Nested Symbols:

```sh
; .obj [.prop 5; 1, 2, 3]    # Define an object with property `.prop`.
# [.prop 5; 1, 2, 3]

; obj.prop                   # Access property `.prop` from obj.
# 5

; .obj.prop 7                # Modify property `.prop`.
# [.prop 7; 1, 2, 3]

; obj.1                      # Access second element of obj.
# 2
```

---

## Pre-Defined Operators

Operators in Sigma Calculus are binary, meaning they always operate on two Monads. Operators return closures that can be applied to a second argument. The leading dot is often omitted for operators.

### Common Operators


#### FOLD

The primitive iterator used for:

- **Reduce (`|`)**: Aggregates elements into a single value.
- **Map (`&`)**: Applies a function to each element and returns a new collection.

**Example:**

```sh
; [1, 2, 3] | ()    # Sum all elements in the array.
# 6

; [1, 2, 3] & []   # Group each element in its own array.
# [[1], [2], [3]]
```

#### NAND

The primitive logical operation from which Boolean operators are derived:

- **AND (`&&`)**
- **OR (`||`)**
- **THEN (`?`)**
- **ELSE (`:`)**

**Example:**

```sh
; .true <>;            # Define a true value.
; .false ()            # Define a false value.

; true && false      # Logical AND.
# false

; true || false      # Logical OR.
# true

; true ? 1
# 1
; false ? 1
# ()
; 1 : 2
# 1
; () : 2
# 2
```

#### EQUAL

Used to check for equality between Monads:

- **`==`**: Compares values for equality.
- **`===`**: Compares if two objects are identical.

**Example:**

```sh
; 5 == 5
# <>
; [1, 2, 3] == [1, 2, 3]
# <>
; [1, 2, 3] == [1, 2]
# ()

; .a 5; .b 5;
; a == b
# <>
; a === b
# ()
```

> NOTE: The `=` operator is reserved and unusable, to avoid confusion with assignment.
