# Homiconic C
version: 0.3.11

[![Codeship Status for TheSwanFactory/hclang](https://app.codeship.com/projects/b1198f30-aee9-0137-5fdc-4a1003a17a1c/status?branch=master)](https://app.codeship.com/projects/362584)

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/) (HC) is a single universal language for code and data.  This repository contains the first implementation of HC as an interpreter written in TypeScript running on `nodejs`.  It also contains a sample application called MAML, the [*Multipurpose Abstract Markup Language*](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/).  MAML is a radically simple proposal for replacing all the existing web technologies (HMTL, CSS, JavaScript, SVG, etc.) with a single format based on HC.

## Usage

```
$ npm install
$ export DEBUG=true # optional
$ npm run hc
```
This will launch the interpreter.

## BitScheme

To generate and run the BitScheme documentation, type:
```
$ npm run bs:all
```
This will open the BitScheme.html file, and also run the documentation through the testdoc evaluator which will generate pass/fail messages.

## Development

1. Install the [Atom editor](http://flight-manual.atom.io/getting-started/sections/installing-atom/).

2. Install the [language-maml](https://github.com/TheSwanFactory/language-maml) Atom package.

3. Clone the [github repository](https://github.com/TheSwanFactory/hclang.git).

4. Install [node.js](https://nodejs.org/).
  * e.g., `brew install node` on macOS.

5. Run `npm test`.

## Debugging
0. $ npm run inspect
5. # In Chrome: chrome://inspect
