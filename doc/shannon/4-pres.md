# TSM-4: Total Computing with Pres — The Future of Safe, Expressive Software

For decades, the pursuit of Turing-complete computing has been the foundation of modern programming. While it has empowered developers to build powerful, general-purpose systems, it has also forced us to accept a troubling reality: bugs, crashes, and unpredictable behavior are often seen as inevitable. We’ve been told these issues are the price we pay for the flexibility and expressiveness of Turing completeness—a trade-off necessitated by the halting problem.

## **The Insight: Computing Could Be Complete**

The idea that computing must be incomplete—prone to unpredictable behavior because of the inherent risks of non-termination—has dominated the landscape. But what if that notion was wrong? In the 1930s, mathematician Mojżesz Presburger introduced **Presburger arithmetic**, a system that demonstrated that not all forms of arithmetic lead to undecidability. Unlike Peano arithmetic, which underpins Turing-complete systems, Presburger arithmetic is decidable, meaning every valid statement can be resolved, avoiding the halting problem altogether.

This insight revealed that computational completeness—where every program would terminate predictably—is possible. It challenged the prevailing belief that powerful computation inherently comes with the risk of incompleteness. If a programming language could embrace these principles, it could provide a safer, more reliable computing experience.

## **The Challenge: Total Computing and Its Limitations**

In the wake of this insight, the niche of **total computing** emerged. Total functions—those that always terminate and produce a result—became a focal point for building safer, more predictable software. By ensuring that every function in a language is total, developers could eliminate a whole class of bugs related to non-termination. However, as developers tried to apply these principles in practice, they encountered significant challenges:

- **Expressiveness vs. Safety:** Total languages often imposed strict constraints on programming constructs, such as loops and recursion, limiting their expressiveness and making it difficult to model complex, real-world systems.

- **Complexity of Dependent Types:** While dependent types allowed for precise and safe software, they introduced complexity that made them difficult to use, leading to a steep learning curve for developers.

- **Handling Continuous and Adaptive Systems:** Real-world applications often require ongoing processes, dynamic adaptation, and interaction with unpredictable environments—areas where total languages traditionally struggled to provide both safety and flexibility.

## **Enter Pres: Redefining Total Computing**

Recognizing these challenges, **Pres** was designed to build on the promise of total computing while addressing its shortcomings. But Pres takes a different approach: **programmer productivity** is its primary goal, with provability and safety as natural side benefits. This shift in focus allows Pres to combine the best aspects of totality with the expressiveness and usability needed for modern software development.

## **How Pres Solves the Challenges**

### **1. Balancing Expressiveness and Safety with Arrays and Fold**

To address the challenge of balancing expressiveness and safety, Pres adopts **arrays as the primary data type** and **fold (or reduce) as the primary operation**. Arrays provide a clear, bounded structure that is easy to reason about, ensuring that operations on them are safe and predictable. By using fold as the fundamental operation, Pres allows developers to express complex transformations and computations in a way that guarantees termination. Fold processes arrays element by element, aggregating results in a controlled, predictable manner, making it a natural fit for total computing.

This approach allows developers to write expressive code that can handle a wide range of computational tasks while maintaining the safety guarantees that come with totality. The use of arrays and fold strikes a balance between the flexibility of higher-order operations and the need for rigorous, provably correct code.

### **2. Simplifying Dependent Types with Homoiconic Type Expressions**

Dependent types are powerful tools for building safe, robust software, but they’ve traditionally been difficult to use due to their complexity. Pres simplifies dependent types by integrating them as **homoiconic type expressions**—types that are treated as first-class citizens within the language. This means types can be manipulated and composed just like any other data, reducing the verbosity and overhead typically associated with dependent types. This approach allows developers to define precise, reliable types without getting bogged down in complex proofs, making it easier to enforce strict correctness guarantees in even the most complex systems.

### **3. Handling Continuous and Adaptive Systems with Asynchronous, Event-Driven Architecture**

One of the biggest challenges in total computing has been modeling continuous processes and adaptive systems—applications that often require potentially infinite loops or recursive functions. Pres addresses this by embracing an **asynchronous, event-driven architecture**. Rather than relying on traditional looping constructs, Pres structures system interactions through events. Each event handler is guaranteed to terminate, enabling the development of adaptive, real-time systems without sacrificing safety. This architecture supports complex, scalable applications by breaking down processes into manageable, finite tasks that can be executed in parallel.

## **Pres: A Language for the Future**

Pres is more than just a programming language—it’s a reimagining of what total computing can be. By prioritizing programmer productivity and embracing the principles of totality, Pres delivers a language that is both safe and expressive, capable of handling the complexities of modern software development.

Whether you're working on real-time systems, distributed applications, or complex simulations, Pres provides the tools you need to build software that’s reliable, adaptable, and powerful. It’s time to move beyond the limitations of Turing completeness and embrace a future where every line of code is both expressive and trustworthy.

---

Get ready to explore what Pres can do. We’ll be sharing more details soon on how you can start building with this groundbreaking new language.

---
