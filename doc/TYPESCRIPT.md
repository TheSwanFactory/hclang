# Using this module in other modules

Here is a quick example of how this module can be used in other modules. The
[TypeScript Module Resolution Logic](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
makes it quite easy. The file `src/index.ts` acts as an aggregator of all the
functionality in this module. It imports from other files and re-exports to
provide a unified interface for this module. The _package.json_ file contains
`main` attribute that points to the generated `lib/index.js` file and `typings`
attribute that points to the generated `lib/index.d.ts` file.

> If you are planning to have code in multiple files (which is quite natural for
> a NodeJS module) that users can import, make sure you update `src/index.ts`
> file appropriately.

Now assuming you have published this amazing module to _npm_ with the name
`my-amazing-lib`, and installed it in the module in which you need it -

- To use the `Frame` class in a TypeScript file -

```ts
import { Frame } from "my-amazing-lib";

const frame = new Frame("World!");
frame.greet();
```

- To use the `Frame` class in a JavaScript file -

```js
const Frame = require("my-amazing-lib").Frame;

const frame = new Frame("World!");
frame.greet();
```
