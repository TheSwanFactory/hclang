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
Reading is a reduce over characters, so what the read starts from is what shapes
them. Text joins them back into whole content; an aggregate keeps them apart. No
part of the reading is a property of the resource
```
; './out.txt' | “”
# “hello”
; './out.txt' | []
# [“h”, “e”, “l”, “l”, “o”]
; './out.txt' & {_}
# [“h”, “e”, “l”, “l”, “o”]
```
A write replaces, since there is no receiver to chain from
```
; './out.txt' “goodbye”
# 7
; './out.txt' | “”
# “goodbye”
```
Path extension is attenuation: a longer reference names a location inside the
root by construction, and intermediate directories are created on the way
```
; './notes/day/1.txt' “deep”
# 4
; './notes/day/1.txt' | “”
# “deep”
```
`./`, `/`, and a bare path all name the same location. There is no ambient
working directory to make them differ, because that would be ambient authority
```
; '/out.txt' | “”
# “goodbye”
; 'out.txt' | “”
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
Those components describe the reference the value is rather than contents it
holds, so they are readable by name and never part of the stream. A doubled read
is therefore indexed characters, with no identity metadata mixed in
```
; './out.txt' .path
# “./out.txt”
; './out.txt' && {_}
# [[.0, “g”], [.1, “o”], [.2, “o”], [.3, “d”], [.4, “b”], [.5, “y”], [.6, “e”]]
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
An absent location is a refusal the iteration collects like any other value, and
it stays distinguishable from an empty one: absent and empty are different facts,
and only one of them is a failure
```
; './missing.txt' | []
# [$!.resource-absent './missing.txt']
; './empty.txt' “”
# 0
; './empty.txt' | []
# ()
```
The root binding is reachable by name, which is what makes the perimeter
enumerable rather than ambient. It prints as the reference it denotes and never
as the host location behind it
```
; $$.root
# '.'
