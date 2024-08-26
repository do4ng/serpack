import { join } from 'path';
import { rmSync } from 'fs';
import esbuild, { Format } from 'esbuild';

import { BuildOptions } from '../options';
import { Analyzer } from '../core';
import { depsPlugin, resetCache } from './plugins/deps';

export async function compile(id: string, options: BuildOptions = {}): Promise<void> {
  const esbuildOptions = options.buildOptions;
  const analyzer = new Analyzer(id, options);

  const deps = analyzer.analyzeDeps();
  const resolver = analyzer.factory;

  const outdir = options.outdir || 'dist';

  options.extensions = {
    cjs: options.extensions?.cjs || '.js',
    esm: options.extensions?.esm || '.mjs',
  };

  if (options.clean) {
    rmSync(outdir, { force: true, recursive: true });
  }

  // analyze dependents
  for (const dependency of Object.keys(deps.dependencies)) {
    deps.dependencies[dependency]?.forEach((dep) => {
      const caller = deps.dependents[dep];

      if (caller.length !== 1) {
        deps.dependencies[dependency][deps.dependencies[dependency].indexOf(dep)] = null;
        // console.log('-', dep);
      } else {
        // console.log('+', dep);
        delete deps.dependencies[dep];
      }
    });
  }

  const build = async (format: Format[]) => {
    const baseOptions: esbuild.BuildOptions = {
      // user esbuild options
      ...esbuildOptions,

      // default build options (fixed)
      entryPoints: [id],
      bundle: true,
      platform: 'node',
    };

    const userPlugin = (esbuildOptions?.plugins || []) as any;

    const createDepPlugin = (type: 'chunk' | 'entry') =>
      depsPlugin(
        {
          deps,
          resolver,
          paths: {
            entry: id,
            chunks: join(outdir, 'chunks'),
          },
          options,
          build: async (target, output, initialOptions) => {
            await esbuild.build({
              ...initialOptions,
              entryPoints: [target],
              outfile: join(outdir, output),
              plugins: [...userPlugin, createDepPlugin('chunk')],
            });
          },
        },
        type
      );

    for await (const ty of format) {
      resetCache(); // reset cache
      await esbuild.build({
        ...baseOptions,
        outfile: join(outdir, `index${options.extensions[ty] || '.js'}`),
        format: ty,
        plugins: [...userPlugin, createDepPlugin('entry')],
      });
    }
  };

  await build((options.format || ['cjs']) as Format[]);
}
