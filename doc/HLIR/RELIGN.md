# **RELIGN: A Homoiconic Language for Synchronous, Stateful Reactive Hardware Design**

## Opening: Setting the Stage

**Phil**\
Good morning, everyone. It's great to be here at [DAC](https://www.dac.com)—a
conference that brings together the best minds in design automation. For those
of you who may not know me, my name is
[Phil Moorby](https://en.wikipedia.org/wiki/Phil_Moorby), and I’m best known as
the creator of [Verilog](https://en.wikipedia.org/wiki/Verilog), a language that
has served the hardware industry for decades.

When I first introduced Verilog, the goal was simple: to make hardware design
accessible, efficient, and scalable. But as the years have gone by, our
challenges have evolved. The systems we design today are not only larger and
more complex but must also integrate seamlessly with software and respect
physical constraints like energy and time. Verilog, as powerful as it is, wasn’t
built to handle these new demands.

Today, I’m excited to share with you **RELIGN**, a new programming language that
builds on decades of experience while introducing innovative concepts designed
for the future of hardware and software co-design.

---

### The Problem Today

**Phil**\
Let me start by framing the problem. Traditional hardware description languages
like Verilog are static by nature. They were designed to describe hardware
structures but lack the flexibility to model modern, adaptive systems. At the
same time, event-driven or functional programming models in software are great
for reactivity but fall short when it comes to deterministic execution—something
hardware requires.

Here’s the kicker: neither of these paradigms adequately handles **time** or
**energy** as first-class concepts, and yet these are critical for sustainable,
efficient design in today’s world.

_Phil pauses, letting the gravity of the problem sink in._

This is where RELIGN comes in. RELIGN isn’t just another language—it’s a
framework for **synchronous, stateful reactive programming (SSRP)**. It’s built
to bridge the gap between hardware and software, offering the deterministic
precision of hardware languages and the dynamism of modern programming models.

---

### Introducing RELIGN

**Phil**\
So, what makes RELIGN different? Three key principles.

1. **Homoiconicity**: The language’s structure is its data. This means that
   RELIGN programs can be interpreted for rapid iteration, compiled for
   efficiency, or even synthesized into hardware descriptions like Verilog—all
   without breaking abstraction.

2. **First-Class Signals**: Signals carry not just values but also timestamps
   and metadata like energy costs or delays, allowing us to model causality and
   physical constraints with precision.

3. **Hexons**: Modular building blocks that encapsulate both behavior—what we
   call "effect"—and physical constraints, or "affect," such as time and energy.

---

### RELIGN in Action: Modeling, Simulation, and Synthesis

**Phil**\
Let’s see RELIGN in action with a simple example. Here, we’re defining a hexon—a
basic building block that takes two inputs, adds them together, and produces one
output.

```shell
.Adder ^ (.a <i32>, .b <i32>, .sum! <i32>) {
     @sum! a + b
}
```

This defines the **effect**: the relationship between inputs and outputs. But
RELIGN also tracks the **affect**—how long the operation takes and how much
energy it consumes. By default, every hexon has a time cost of one clock cycle
and a small energy cost, though these can be customized.

_Phil gestures to a second slide._

Now, let’s simulate this. We define three signals: `a`, `b`, and `sum`. We
connect the inputs to the hexon, run a clock cycle, and observe the output.

```shell
.in1 <signal> 3;
.in2 <signal> 4;
.out! <signal>;

.adder Adder(in1, in2, out!);
adder.tick();
out  # automatically outputs 7
```

Here, the interpreter runs RELIGN dynamically, propagating values through the
hexon and updating the output signal. The result is `7`, as you’d expect. But
what’s unique here is that RELIGN also tracks the time spent and energy
consumed, which we can analyze later.

**Phil (pauses, smiling)**\
Now, what if we want to deploy this in hardware? RELIGN’s homoiconicity makes
this seamless. Let me show you the Verilog code that RELIGN generates for the
same example.

```shell
module Adder(
  input [31:0] a,
  input [31:0] b,
  output [31:0] sum
);
  assign sum = a + b;
endmodule
```

In just a few steps, we’ve gone from modeling to simulation to hardware
synthesis. That’s the power of RELIGN.

---

### Comparisons and Broader Implications

**Phil**\
Let’s take a step back and compare RELIGN to existing paradigms.

- **[Verilog](https://en.wikipedia.org/wiki/Verilog)**: Adds dynamism. You can
  simulate and modify systems on the fly, something Verilog struggles with.
- **[SIGNAL](https://en.wikipedia.org/wiki/SIGNAL_(programming_language)#:~:text=SIGNAL%20is%20a%20programming%20language,describing%20both%20data%20and%20control.)**:
  Incorporates physical constraints like energy and time, making it more
  realistic for modern systems.
- **[Erlang](https://en.wikipedia.org/wiki/Erlang_(programming_language))**:
  Offers a reliable stateful actor model but lacks the precision and determinism
  needed for hardware.
- **Reactive Libraries (e.g., [RxJS](https://rxjs.dev/))**: RELIGN is
  deterministic and synchronous, perfect for hardware fidelity.

---

### Broader Implications and Call to Action

**Phil**\
RELIGN isn’t just a language—it’s a paradigm shift. It bridges hardware and
software, enabling true co-design. It introduces energy-aware programming,
aligning with today’s demand for sustainability. And it scales from small,
modular hexons to complex, distributed systems.

But this is just the beginning. RELIGN’s full potential lies in collaboration.
That’s why I’m here—to invite you to join this journey. Whether you’re a
hardware designer, a software engineer, or a researcher, RELIGN offers something
new and transformative.

_Phil looks out at the audience, a thoughtful pause._

Let’s redefine what’s possible in hardware and software design—together.

_The audience erupts into applause as Phil steps back from the podium._
