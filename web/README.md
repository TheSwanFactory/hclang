# Homiconic C (Web Interface)

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)
(HC) is a single universal language for code and data. This repository contains
the first implementation of HC as an interpreter written in TypeScript running
on [deno](https://deno.land/).

## Deno Usage

```sh
deno task t  # lint and test
open http://localhost:8000
deno task start
```

## Aider Configuration

```sh
export ANTHROPIC_API_KEY=your-api-key
aider --model sonnet  # automatically set in .aider.conf.yml
```
