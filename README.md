# Homiconic C

[ ![Codeship Status for HC](https://app.codeship.com/projects/aaeb71c0-b7d8-0134-5ab7-22c228ba91d5/status?branch=master)](https://app.codeship.com/projects/194564)

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/) (HC) is a single universal language for code and data.  This repository contains the first implementation of HC as an interpreter written in TypeScript running on `nodejs`.  It also contains a sample application called MAML, the [*Multipurpose Abstract Markup Language*](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/).  MAML is a radically simple proposal for replacing all the existing web technologies (HMTL, CSS, JavaScript, SVG, etc.) with a single format based on HC.

## Getting Started

1. Install the [Atom editor](http://flight-manual.atom.io/getting-started/sections/installing-atom/).

2. Install the [language-maml](https://github.com/TheSwanFactory/language-maml) Atom package.

3. Clone the [github repository](https://github.com/TheSwanFactory/hclang.git).

4. Install [node.js](https://nodejs.org/).
  * e.g., `brew install node` on macOS.

5. Run `npm test`.

## Debugging
0. $ npm install -g inspect-process
1. $ sudo ln -s $CWD/lib/node_modules/inspect-process/bin/inspect.js /usr/local/bin/inspect
2. $ alias debug='inspect _mocha --no-timeouts --compilers ts:ts-node/register --recursive test/**/*-spec.ts'
3. # Add/uncomment "debugger;"
4. $ debug
5. # In Chrome: about:inspect -> inspect
