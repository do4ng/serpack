import { join } from 'path';

import { compile } from '../packages/core/src/compiler';
import { generateTypeDeclaration } from '../packages/core/src/compiler/dts';
import { BuildOptions } from '../packages/core/src/options';

const target = join(process.cwd(), 'packages', 'core', 'src', 'index.ts');
const outdir = join(process.cwd(), 'packages', 'core', 'dist');

const options: BuildOptions = {
  excludeNodeModules: true,
  clean: true,
  format: ['esm', 'cjs'],
  chunks: {
    name: 'chunk.[index]',
  },
  outdir,
};

compile(target, options);
generateTypeDeclaration(target, join(outdir, '../', 'types'));
