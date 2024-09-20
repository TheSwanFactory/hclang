# Homiconic C

version: 0.5.14

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/) (HC) is a single universal language for code and data.  This repository contains the first implementation of HC as an interpreter written in TypeScript running on `nodejs`.  

It also contains a sample application called MAML, the [*Multipurpose Abstract Markup Language*](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/).  MAML is a radically simple proposal for replacing all the existing web technologies (HMTL, CSS, JavaScript, SVG, etc.) with a single format based on HC.

HC can also be used to define easily-parseable variants of other common file formats (e.g., HCSV, HCSON).

## Usage

```shell
npm install
export DEBUG=true # optional
npm run hc
```

This will launch the interpreter.

## BitScheme

To generate and run the BitScheme documentation, type:

```shell
npm run bs:all
```

This will open the BitScheme.html file, and also run the documentation through the testdoc evaluator which will generate pass/fail messages.

## Development

1. Clone the [github repository](https://github.com/TheSwanFactory/hclang.git).

2. Install [node.js](https://nodejs.org/).

   * e.g., `brew install node` on macOS.

3. Run `npm test`.

NOTE: The [language-hclang](https://github.com/TheSwanFactory/language-hclang) vscode extension is still in development.

## Publishing

From the feature branch:

1. Update CHANGELOG.md

1. Run `npm run done` to bump version and tag

1. Merge PR

Should automatically publish to [npmjs](https://www.npmjs.com/package/hclang).
