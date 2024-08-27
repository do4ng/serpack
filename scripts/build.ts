import { join } from 'path';

import { Compiler } from '../packages/core/src/compiler';
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

const compiler = new Compiler(
  {
    [target]: 'index',
  },
  options
);
compiler.beforeBuild();
compiler.compile();

generateTypeDeclaration(target, join(outdir, '../', 'types'));
