#!/usr/bin/env hc
```
Resource references (#348)

These examples are the executable acceptance corpus for the `'…'` resource
primitive. A resource identifier is the resource: when a root binding is
reachable in the invocation context, applying the identifier writes and
enumerating it reads. There is no I/O primitive to name.

The Deno CLI installs a root binding at a fresh temp directory, so these
examples write and read real files without naming a real path anywhere.

Writing is application, and it answers with the characters written rather than
with the receiver, so a refusal cannot hide inside a successful-looking result
```
; './out.txt' “hello”
# 5
```
Reading is the enumerable protocol `|` and `&` already use. The element is the
whole content, because the element type travelling with the resource is #368
```
; './out.txt' | {_}
# [“hello”]
; './out.txt' & {_}
# “hello”
```
A write replaces, since there is no receiver to chain from
```
; './out.txt' “goodbye”
# 7
; './out.txt' & {_}
# “goodbye”
```
Path extension is attenuation: a longer reference names a location inside the
root by construction, and intermediate directories are created on the way
```
; './notes/day/1.txt' “deep”
# 4
; './notes/day/1.txt' & {_}
# “deep”
```
`./`, `/`, and a bare path all name the same location. There is no ambient
working directory to make them differ, because that would be ambient authority
```
; '/out.txt' & {_}
# “goodbye”
; 'out.txt' & {_}
# “goodbye”
```
Evaluating an identifier still performs no access, so an identifier the root
binding could never reach is still an ordinary printable, decomposable value
```
; 'https://theswanfactory.com/hc?v=1'
# 'https://theswanfactory.com/hc?v=1'
; 'https://theswanfactory.com/hc'.authority
# “theswanfactory.com”
```
Refusal is a value. A parent reference is refused at normalization, before any
host call
```
; '../escape' “no”
# $!.resource-parent-escape '../escape'
; './a/../b' “no”
# $!.resource-parent-escape './a/../b'
```
So is an escape that would reintroduce a separator or a dot segment
```
; './%2e%2e/escape' “no”
# $!.resource-encoded-separator './%2e%2e/escape'
; './a%2fb' “no”
# $!.resource-encoded-separator './a%2fb'
```
A scheme is an empty slot in a handler table that #367 will supply, so it fails
closed with a nameable refusal rather than reaching the network
```
; 'https://example.com/x' “no”
# $!.resource-scheme-unbound 'https://example.com/x'
; 'jsr:@swanfactory/hclang' “no”
# $!.resource-scheme-unbound 'jsr:@swanfactory/hclang'
```
A single letter is a legal RFC 3986 scheme, and drive-letter heuristics do not
belong in the trusted base. RFC 3986 §4.2 already supplies the remedy: `./`
```
; 'C:/tmp/x' “no”
# $!.resource-scheme-unbound 'C:/tmp/x'
; './C:/tmp/x' “ok”
# 2
```
An absent location is a refusal the iterator collects like any other value
```
; './missing.txt' | {_}
# [$!.resource-absent './missing.txt']
```
The root binding is reachable by name, which is what makes the perimeter
enumerable rather than ambient. It prints as the reference it denotes and never
as the host location behind it
```
; $$.root
# '.'
