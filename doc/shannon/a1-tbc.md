# TSM-10: "To Be Continued" -- A Homoiconic Language for Continuations and Concurrency

## 1. **Origins of TBC**

"To Be Continued" (TBC) was born from the desire to unify **control flow** and **data processing** in a simple, flexible language. It is inspired by **Homoiconic C (HCLang)**, which introduced:

- **Homoiconicity**: Code is data. Programs can manipulate themselves naturally.
- **Keywordless Design**: No reserved keywords—syntax is driven by data-like constructs.
- **Scope-Driven Semantics**: Constructs like functions, processes, and flows are represented as aggregates, ensuring clarity and uniformity.

TBC builds on these principles by introducing **continuations** (`@`) as a first-class concept to simplify **state**, **concurrency**, and **control flow** in asynchronous systems.

---

## 2. **The TBC Philosophy**

### 2.1. Continuations as the Core Abstraction

In TBC, **continuations** are the "what happens next" of computation, represented by `@`. They unify control flow concepts such as `return`, `yield`, `await`, and error handling into a single, declarative mechanism.

```sh
.add (.x .y) ^ {@ (.x + .y)}
.add (3 4)  # Output: 7
```

- **`^` means binding**, not execution: It defines relationships between components, like arguments and continuations.
- **`@` means execution**: Represents the continuation, handling the "next step."

### 2.2. Declarative and Homoiconic

TBC adopts **HCLang’s keywordless style**, replacing imperative constructs like `if`, `return`, and `try` with **data-like flows**:

```sh
.divide (.x .y) ^ {
  .match (.y)
    <(0 -> @ ("Error: Division by zero"))
    (_ -> @ (.x / .y))
}

.divide (10 2)  # Output: 5
.divide (10 0)  # Output: Error: Division by zero
```

This data-driven design improves readability and aligns with TBC’s **code-as-data** philosophy.

---

## 3. **Getting Started: Literals and Functions**

### 3.1. Literals and Automatic Rendering

In TBC, all expressions are **evaluated and rendered automatically** unless suppressed with `;`:

```sh
"Hello, world!"  # Output: Hello, world!
1 + 2            # Output: 3
3 * 4;           # Suppressed output
```

- **Automatic Rendering**: Simplifies REPL workflows.
- **Suppression with `;`**: Useful for intermediate steps.

In Elixir:

```sh
IO.puts("Hello, world!")  # Equivalent to automatic rendering in TBC
1 + 2                    # Requires inspection or explicit output
```

### 3.2. Defining Functions

Functions are **bound** with `^` and use `@` for continuations:

```sh
.add (.x .y) ^ {@ (.x + .y)}

.add (3 4)  # Output: 7
```

- **No Explicit Return**: Results are rendered automatically unless suppressed.

In Elixir:

```sh
def add(x, y), do: x + y
add(3, 4)  # Must explicitly render or print the result
```

---

## 4. **Control Flow with Continuations**

### 4.1. Continuation Passing

TBC continuations resemble Elixir’s pipelines but operate explicitly through `@`:

```sh
.add (.x .y) ^ {@ (.x + .y)}
.multiply (.x .y) ^ {@ (.x * .y)}

.add (3 4) ^ {@ (.sum {
  .multiply (.sum 2)  # Output: 14
})}
```

In Elixir:

```sh
result =
  3
  |> add(4)
  |> multiply(2)

IO.puts(result)  # Must explicitly output the result
```

---

### 4.2. Pattern Matching

TBC uses **pattern matching** for declarative control flow:

```sh
.divide (.x .y) ^ {
  .match (.y)
    <(0 -> @ ("Error: Division by zero"))
    (_ -> @ (.x / .y))
}

.divide (10 2)  # Output: 5
.divide (10 0)  # Output: Error: Division by zero
```

In Elixir:

```sh
def divide(x, y) do
  case y do
    0 -> "Error: Division by zero"
    _ -> x / y
  end
end

divide(10, 2)  # Must explicitly output the result
divide(10, 0)
```

---

## 5. **Processes and State**

TBC extends HCLang’s framelike constructs to model **stateful processes**. Processes in TBC resemble Elixir’s GenServer but are more concise.

### Example: Counter Process

```sh
.Counter (
  .state <(.value 0)>
  .increment ^ {
    .state.value (.state.value + 1)
    @ (.state.value)
  }
  .reset ^ {
    .state.value 0
    @ (.state.value)
  }
)

.Counter.increment  # Output: 1
.Counter.increment  # Output: 2
.Counter.reset       # Output: 0
```

In Elixir:

```sh
defmodule Counter do
  use GenServer

  def start_link(initial_value), do: GenServer.start_link(__MODULE__, initial_value, name: __MODULE__)
  def increment(), do: GenServer.call(__MODULE__, :increment)
  def reset(), do: GenServer.call(__MODULE__, :reset)

  def handle_call(:increment, _from, state), do: {:reply, state + 1, state + 1}
  def handle_call(:reset, _from, _state), do: {:reply, 0, 0}
end

{:ok, _pid} = Counter.start_link(0)
Counter.increment() # => 1
Counter.reset()     # => 0
```

---

## 6. **Scoped Transactions**

TBC uses **scoped continuations** for transactions and workflows, with automatic rendering or suppression as needed:

```sh
.transaction (
  .actions <[
    ^ {@ ("Step 1 executed")},
    ^ {@ ("Step 2 executed")},
    ^ {@ ("Error in Step 3")}
  ]>
  .on_success ^ {@ ("Transaction succeeded");}
  .on_error ^ {@ (.error "Transaction failed: " .error);}
)

.transaction.actions
```

- **Automatic Execution**: Each action outputs unless suppressed.
- **Scoped Error Handling**: Errors propagate to `.on_error`.

In Elixir:

```sh
def transaction(actions) do
  Enum.reduce_while(actions, :ok, fn action, _acc ->
    case action.() do
      :error -> {:halt, "Transaction failed"}
      _ -> {:cont, :ok}
    end
  end)
end

transaction([fn -> "Step 1 executed" end, fn -> :error end])
```

---

## 7. **Why TBC?**

TBC bridges the gap between:

1. **HCLang’s minimalist, homoiconic vision**, and
2. **Modern requirements for stateful, asynchronous systems**.

### Features Elixir Developers Will Love

- **Keywordless Syntax**: Simplifies code with declarative constructs.
- **Continuations**: Handle control flow, errors, and async tasks uniformly.
- **Stateful Processes**: Lightweight alternatives to GenServer.

### Where to Use TBC

- **Concurrent Systems**: Manage workflows and parallel tasks.
- **Stateful Applications**: Simplify state management declaratively.
- **Exploratory Programming**: Automatic rendering and suppression are ideal for interactive development.
