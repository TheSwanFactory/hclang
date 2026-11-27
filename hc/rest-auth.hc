#!/usr/bin/env hc
```
Credentialed, attenuated REST (#570)
The harness installs only the issues child. The private repository root supplies
the credential in live mode, and the same program runs with fixture data in
`test:doc`. Credential setup belongs to `hc --rest <file> --grants`, never to HC.
The trusted API must not reflect authorization into responses.
```
; .issues 'https://api.github.com/repos/TheSwanFactory/hclang/issues/';
; (issues [.path “277”]).status
# 200
; issues [.path “277”, .method “POST”, .body “{}”]
# $!.resource-method-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/issues/'
; issues [.path “../pulls/277”]
# $!.resource-parent-escape 'https://api.github.com/repos/TheSwanFactory/hclang/issues/'
; 'https://api.github.com/repos/TheSwanFactory/hclang/' []
# $!.resource-unbound 'https://api.github.com/repos/TheSwanFactory/hclang/'
; issues [.path “277”, .headers [.authorization “replace”]]
# $!.resource-header-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/issues/'
```
Requests may specify GET, HEAD, POST, PUT, PATCH or DELETE when the installed
grant allows it. Bodies are strings, UTF-8, permitted only for POST/PUT/PATCH.
The grant bounds their bytes. A write records intent before dispatch and
completion before releasing its response. A failure after dispatch is uncertain,
identified by a requestId; the runtime never retries it automatically.
```
