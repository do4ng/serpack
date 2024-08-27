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

## Apis

### Options

| Property             | Type         | Description                                                                 | Default                           |
| -------------------- | ------------ | --------------------------------------------------------------------------- | --------------------------------- |
| `externals`          | `string[]`   | An array of external module names.                                          |                                   |
| `excludeNodeModules` | `boolean`    | Whether to exclude the `node_modules` directory from the build.             |                                   |
| `format`             | `string[]`   | The module formats to build (e.g., `'cjs'`, `'esm'`).                       |                                   |
| `buildOptions`       |              | An object for `esbuild` build options, excluding specific fields.           |                                   |
| `outdir`             | `string`     | The output directory path.                                                  |                                   |
| `chunks`             | `object`     | Chunk settings.                                                             |                                   |
| `chunks.dir`         | `string`     | The directory path where chunks will be stored.                             |                                   |
| `chunks.name`        | `string`     | The naming pattern for chunks. You can use `id` and `index` in the pattern. | `"[id].[index]"`                  |
| `clean`              | `boolean`    | Whether to remove the `dist` directory before the build.                    |                                   |
| `extensions`         | `object`     | File extensions for each format.                                            | `{ "cjs": ".js", "esm": ".mjs" }` |
| `extensions.cjs`     | `.${string}` | The file extension for the CommonJS format.                                 | `.js`                             |
| `extensions.esm`     | `.${string}` | The file extension for the ECMAScript module format.                        | `.mjs`                            |

### Compiler

#### `compile()`

Compile typescript/javascript files.

```ts
type entries = { [key: /* entry file */ string]: string /* library name */ };
```

```ts
compile(
  { './src/index.ts': 'index', './lib/lib-1.ts': 'lib1' },
  {
    /* options */
  }
);
```

### Analyzer

#### `Analyzer`

Analyze dependencies/dependents

```ts
const analyzer = new Analyzer(entry);
const { dependencies, dependents } = analyzer.analyzeDeps();
```

## License

MIT
