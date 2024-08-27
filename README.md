# serpack

Compiler for node library.

- Splitting to reduce size
- Esm/Cjs, Javascript/Typescript Supported
- Type declaration (`.d.ts`)

```ts
import { compile, generateTypeDeclaration } from 'serpack';

compile({ './src/index.ts': 'index', './lib/lib-1.ts': 'lib1' } /* options */); // compile typescript file
generateTypeDeclaration('./src/index.ts', './types'); // generate type declarations
```

This is not a **bundler**.

Although bundling is included during compilation, it works by splitting it into several chunks through chunk splitting, rather than bundling it as a single file.

> This project relies heavily on [oxc](https://github.com/oxc-project/oxc).
