# Introducing the Fractor Model: A Fractional Actor Approach to Shared Mutable State for Systems Programming

Inspired by **[BitC](https://danluu.com/bitc-retrospective/)** and the work of
**[Jonathan Shapiro](https://pixelfabsuite.medium.com)** on systems programming,
the **Fractor Model** is a refinement of the Actor model, designed to manage
**shared mutable state** with precision and control. Building on the Actor
paradigm, Fractors allow for **explicit handling of state and effects**, making
them particularly well-suited for low-level, concurrent systems programming. As
the name suggests, **Fractors** emphasize fractal-like, fine-grained control at
the level of individual methods, breaking complex systems into more manageable
parts for better programmer ergonomics and automated type-checking.

## 1. From Actors to Fractors: State and Effects Made Explicit

The **Actor model** is powerful for isolated objects communicating via
message-passing, but it encounters challenges when you need **direct interaction
with shared resources**. The **Fractor Model** addresses these challenges by
introducing **Fractors**, which encapsulate mutable state while providing
methods to **read** and **modify** that state. This is based on the effect
typing system first implemented in
**[BitC](http://lambda-the-ultimate.org/node/2979/)**.

## 2. Handle Types in the Fractor Model

Where Rust controls shared access through borrowing, Fractors introduce **four
handle types** that provide explicit control over:

1. **Mutability**: Can the object’s state be modified?
2. **Reassignment**: Can the reference be reassigned to another object?

This can be visualized in a 2x2 matrix:

|                      | **Immutable (No Mutation)** | **Mutable (Allows Mutation)** |
| -------------------- | --------------------------- | ----------------------------- |
| **Reassignable**     | `name` (Immutable Variable) | `name!` (Mutable Variable)    |
| **Non-Reassignable** | `NAME` (Immutable Constant) | `NAME!` (Mutable Constant)    |

### Key Quadrants

- **Reassignable, Immutable** (`name`): Can be reassigned, but does not allow
  state mutation.
- **Reassignable, Mutable** (`name!`): Can be reassigned and allows state
  mutation.
- **Non-Reassignable, Immutable** (`NAME`): Fixed reference, no state mutation
  allowed.
- **Non-Reassignable, Mutable** (`NAME!`): Fixed reference, but allows state
  mutation.

This matrix gives developers precise control over how references interact with
shared mutable state, offering clear semantics for both reassignment and
mutation.

---

## 3. Methods in the Fractor Model

Each **Fractor** encapsulates mutable state and provides methods that can either
access or modify that state. Mutating methods are denoted with the `:`
convention to differentiate them from accessor methods. Importantly, only
mutable handles can invoke mutating methods.

### Example Fractor: Bank Account

Consider a `BankAccount` Fractor with typical operations like depositing and
withdrawing funds:

```rust
fractor BankAccount {
  balance: int;

  get_balance() { 
    return read_fractor(BankAccount).balance; 
  }

  deposit:(amount: int) {
    let account = read_fractor(BankAccount);
    write_fractor(BankAccount, account.balance + amount);
  }

  withdraw:(amount: int) {
    let account = read_fractor(BankAccount);
    if (account.balance >= amount) {
      write_fractor(BankAccount, account.balance - amount);
    } else {
      throw_error("Insufficient funds");
    }
  }

  has_funds(amount: int) {
    return read_fractor(BankAccount).balance >= amount;
  }
}
```

### REPL Example of Handle Types and Usage

```repl
; let account! = new BankAccount(100)  # Mutable variable (balance = 100)
; account!.get_balance()
# 100

; account!.deposit:(50)
; account!.get_balance()
# 150

; account!.withdraw:(200)
@error "Insufficient funds"

; let ACCOUNT! = new BankAccount(200)  # Mutable constant (balance = 200)
; ACCOUNT!.withdraw:(100)
; ACCOUNT!.get_balance()
# 100

; let ACCOUNT = new BankAccount(500)   # Immutable constant
; ACCOUNT.withdraw:(50)
@error "Cannot mutate immutable reference"
```

In this REPL example:

- **Accessor methods** like `get_balance` and `has_funds` can be invoked on any
  handle type.
- **Mutating methods** like `deposit:` and `withdraw:` can only be invoked on
  mutable handles (`name!` or `NAME!`).

---

## 4. Benefits of a Sound and Complete Type System for Effects

The Fractor Model’s handle naming conventions provide a **sound and complete
type system for effects**, ensuring that:

1. **Side effects are controlled**: Only mutable handles (`name!`, `NAME!`) can
   invoke mutating methods (`method:`), ensuring state changes are explicit and
   predictable.
2. **Reassignment is safe**: The model distinguishes between **reassignable**
   and **fixed** references, offering fine-grained control over variable
   lifecycles.
3. **Concurrency safety**: By enforcing clear rules for state mutation and
   access, the Fractor Model prevents common concurrency issues like race
   conditions and unintentional state changes.

### Why It Matters

A **sound and complete type system for effects** ensures:

- **Clear expectations**: You know exactly which references can mutate state or
  be reassigned, preventing surprises in complex systems.
- **Improved safety**: Like Rust’s **borrow checker**, this model ensures safe
  handling of mutable state without needing explicit lifetimes.
- **Simplified reasoning**: With clear rules for mutability and reassignment,
  developers can more easily reason about state transitions, especially in
  concurrent environments.

---

## 5. Conclusion: Fractors as the Next Step in Systems Programming

The **Fractor Model** represents a significant evolution of the Actor model by
explicitly addressing shared mutable state and effects. For systems programmers
familiar with **ownership and borrowing** in Rust, Fractors provide a familiar
but enhanced mechanism for managing state, offering greater control over
mutation and reassignment through **effect typing**.

By refining how we manage **reassignment** and **mutation**, Fractors offer a
**sound and complete type system for effects** that simplifies reasoning about
state and concurrency, while also enhancing safety and predictability in
low-level systems programming.
