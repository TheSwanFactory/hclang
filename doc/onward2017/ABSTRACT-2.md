# Onward 2017! Abstract

## Take 2

The C language has dominated low-level and high-performance programming for over
forty years, largely due to its efficient representation of machine semantics.
Homoiconic C ("HC") aspires to replace C, assembly, and high-level languages
with a simple data format that better captures machine semantics yet enables
higher levels of abstraction. To do this, it draws heavily from Lisp
(homoiconicity), the UNIX shell (dataflow), and BitC (effect typing).

This paper provides a concise summary of the complete syntax and core semantics
of Homoiconic C. We then use HC to build a uniform interface to the entire web
stack (JavaScript, HTML, HTTP, etc.) called MAML, the Multipurpose Abstract
Markup Language. Finally, we use MAML to implement a video game called
FrameWars, which leverages homoiconicity to mutate and evolve AI spaceships.

HC is currently implemented as a TypeScript interperer in the node module
'hclang', and is available under an MIT license at
http://github.com/TheSwanFactory/hclang/.
