# Homiconic C

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)
(HC) is a single universal language for code and data. This repository contains
the first implementation of HC as an interpreter written in TypeScript running
on [deno](https://deno.land/).

It also contains a sample application called MAML, the
[_Multipurpose Abstract Markup Language_](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/).
MAML is a radically simple proposal for replacing all the existing web
technologies (HMTL, CSS, JavaScript, SVG, etc.) with a single format based on
HC.

HC can also be used to define easily-parseable variants of other common file
formats (e.g., HCSV, HCSON).

## Usage

```shell
deno install
export DEBUG=true # optional
deno task hc
```

This will launch the interpreter.

## BitScheme

### TODO: Port to Deno

To generate and run the BitScheme documentation, type:

```shell
npm run bs:all
```

This will open the BitScheme.html file, and also run the documentation through
the testdoc evaluator which will generate pass/fail messages.

## Development

1. Clone the [github repository](https://github.com/TheSwanFactory/hclang.git).

2. Install [deno](https://github.com/denoland/deno).

   - e.g., `brew install deno` on macOS.

3. Run `deno task test`.

NOTE: The [language-hclang](https://github.com/TheSwanFactory/language-hclang)
vscode extension is still being updated.

## Publishing

From the feature branch:

1. Update `CHANGELOG.md` and `version` in `deno.json`

1. Run `deno task tag` to commit version and tag release

1. Merge PR to `main` to publish

Should automatically publish to [jsr](https://jsr.io/@swanfactory/hclang).
