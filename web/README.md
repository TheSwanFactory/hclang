# Homiconic C (Web Interface)

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)
(HC) is a single universal language for code and data.

This repository contains a web interface for HC. It is written in TypeScript,
and can run as a standalone webpage ([static/index.html](./static/index.html)).

We also use a Deno server, primarily for development mode.

## Deno Usage

```sh
open static/index.html
deno task start &
sleep 1 && open http://localhost:8000/local
kill %deno
```
