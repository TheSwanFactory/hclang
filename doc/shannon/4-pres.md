# TSM-4: Total Computing with Pres — The Future of Safe, Expressive Software**

For decades, the pursuit of Turing-complete computing has been the foundation of modern programming. While it has empowered developers to build powerful, general-purpose systems, it has also forced us to accept a troubling reality: bugs, crashes, and unpredictable behavior are often seen as inevitable. We’ve been told these issues are the price we pay for the flexibility and expressiveness of Turing completeness—a trade-off necessitated by the halting problem.

## **The Insight: Computing Could Be Complete**

The idea that computing must be incomplete—prone to unpredictable behavior because of the inherent risks of non-termination—has dominated the landscape. But what if that notion was wrong? In the 1930s, mathematician Mojżesz Presburger introduced **Presburger arithmetic**, a system that demonstrated not all forms of arithmetic lead to undecidability. Unlike Peano arithmetic, which underpins Turing-complete systems, Presburger arithmetic is decidable, meaning every valid statement can be resolved, avoiding the halting problem altogether.

Presburger’s work revealed that computational completeness—where every program would terminate predictably—is possible. This insight challenged the prevailing belief that powerful computation inherently comes with the risk of incompleteness. If a programming language could embrace these principles, it could provide a safer, more reliable computing experience.

## **What is Total Computing?**

**Total computing** refers to a programming paradigm where every function is guaranteed to terminate for all possible inputs, ensuring that programs are safe from infinite loops and other forms of non-termination. In a total programming language, all computations are **total functions**, meaning they produce a result within a finite amount of time, no matter the input. This guarantee makes total computing particularly well-suited for building reliable, predictable software.

Several existing languages have explored aspects of total computing:

- **Agda**: A dependently typed functional programming language and proof assistant that emphasizes totality by default. Agda requires that all functions terminate and all recursive calls are structurally decreasing.
- **Idris**: Another dependently typed language similar to Agda, Idris focuses on practical programming with total functions and offers tools for proving properties about programs.
- **Coq**: A formal proof management system that ensures all defined functions are total, allowing developers to write programs that are provably correct.
- **F***: A functional programming language with a focus on verification and formal methods, F* uses dependent types to enforce totality and correctness.

## **The Challenge: Why Total Computing Hasn't Taken Off**

While these languages have demonstrated the power of total computing, they have often been seen as too restrictive or complex for general-purpose software development. This has limited their adoption outside of niche applications, such as formal verification or academic research. This is because of five significant issues:

1. **Expressiveness vs. Safety:** Total languages often imposed strict constraints on programming constructs, such as loops and recursion, limiting their expressiveness and making it difficult to model complex, real-world systems.

2. **Complexity of Dependent Types:** While dependent types allowed for precise and safe software, they introduced complexity that made them difficult to use, leading to a steep learning curve for developers.

3. **Handling Continuous and Adaptive Systems:** Real-world applications often require ongoing processes, dynamic adaptation, and interaction with unpredictable environments—areas where total languages traditionally struggled to provide both safety and flexibility.

4. **Error Handling:** Managing errors in a way that guarantees safety and termination has been a challenge, as traditional error-handling mechanisms often introduce complexity or potential for non-termination.

5. **Side-Effects:** Managing side effects—like I/O operations or mutable state—while ensuring totality has been a major hurdle, as these effects can lead to unpredictable behavior and complicate reasoning about program correctness.

## **How Pres Addresses These Challenges**

Recognizing these challenges, **Pres** was designed to build on the promise of total computing while addressing its shortcomings. Pres takes a different approach: **programmer productivity** is its primary goal, with provability and safety as natural side benefits. This shift in focus allows Pres to combine the best aspects of totality with the expressiveness and usability needed for modern software development.

### **1. Balancing Expressiveness and Safety with Arrays and Fold**

To address the challenge of balancing expressiveness and safety, Pres adopts **arrays as the primary data type** and **fold (or reduce) as the primary operation**. Arrays provide a clear, bounded structure that is easy to reason about, ensuring that operations on them are safe and predictable. By using fold as the fundamental operation, Pres allows developers to express complex transformations and computations in a way that guarantees termination. Fold processes arrays element by element, aggregating results in a controlled, predictable manner, making it a natural fit for total computing.

This approach allows developers to write expressive code that can handle a wide range of computational tasks while maintaining the safety guarantees that come with totality. The use of arrays and fold strikes a balance between the flexibility of higher-order operations and the need for rigorous, provably correct code.

### **2. Simplifying Dependent Types with Homoiconic Type Expressions**

Dependent types are powerful tools for building safe, robust software, but they’ve traditionally been difficult to use due to their complexity. Pres simplifies dependent types by integrating them as **homoiconic type expressions**—types that are treated as first-class citizens within the language. This means types can be manipulated and composed just like any other data, reducing the verbosity and overhead typically associated with dependent types. This approach allows developers to define precise, reliable types without getting bogged down in complex proofs, making it easier to enforce strict correctness guarantees in even the most complex systems.

### **3. Handling Continuous and Adaptive Systems with Asynchronous, Event-Driven Architecture**

One of the biggest challenges in total computing has been modeling continuous processes and adaptive systems—applications that often require potentially infinite loops or recursive functions. Pres addresses this by embracing an **asynchronous, event-driven architecture**. Rather than relying on traditional looping constructs, Pres structures system interactions through events. Each event handler is guaranteed to terminate, enabling the development of adaptive, real-time systems without sacrificing safety. This architecture supports complex, scalable applications by breaking down processes into manageable, finite tasks that can be executed in parallel.

### **4. Ensuring Safe Error Handling with Maybe Monads**

Error handling in total computing has often been a challenge because traditional mechanisms can introduce complexity or potential non-termination. Pres addresses this by integrating **Maybe monads** as a core feature for managing errors. The Maybe monad encapsulates the possibility of failure in a way that ensures all operations remain total. By requiring developers to explicitly handle the possibility of errors, Pres ensures that every code path is safe, predictable, and terminates correctly. This approach not only simplifies error handling but also makes the intent of the code clearer and easier to reason about.

### **5. Managing Side Effects with BitC-Style Effect Typing**

Handling side effects in a way that maintains totality is one of the most complex challenges in software development. Pres solves this problem by using **BitC-style effect typing**. Effect typing allows side effects to be explicitly tracked in the type system, making it possible to reason about and control side effects while ensuring that all functions remain total. This means that I/O operations, mutable state, and other side effects can be managed safely, without introducing the unpredictability or non-termination risks that typically accompany them.

## **Pres: A Language for the Future**

Pres is more than just a programming language—it’s a reimagining of what total computing can be. By prioritizing programmer productivity and embracing the principles of totality, Pres delivers a language that is both safe and expressive, capable of handling the complexities of modern software development.

Whether you're working on real-time systems, distributed applications, or complex simulations, Pres provides the tools you need to build software that’s reliable, adaptable, and powerful. It’s time to move beyond the limitations of Turing completeness and embrace a future where every line of code is both expressive and trustworthy.

---

Get ready to explore what Pres can do. We’ll be sharing more details soon on how you can start building with this groundbreaking new language.

---