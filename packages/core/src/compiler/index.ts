/* eslint-disable guard-for-in */
import { join } from 'path';
import { rmSync, writeFileSync } from 'fs';
import type { ResolverFactory } from 'oxc-resolver';
import esbuild, { Format } from 'esbuild';

import { BuildOptions } from '../options';
import { Analyzer } from '../core';
import { depsPlugin, getCache, joinPath, resetCache } from './plugins/deps';
import { warn } from '../logger';

function mergeObjects(...objects: Record<string, string[]>[]): Record<string, string[]> {
  return objects.reduce((acc, obj) => {
    Object.entries(obj || {}).forEach(([key, value]) => {
      // eslint-disable-next-line no-prototype-builtins
      if (acc.hasOwnProperty(key)) {
        acc[key] = Array.from(new Set([...acc[key], ...value]));
      } else {
        acc[key] = value;
      }
    });
    return acc;
  }, {});
}

function optimizeDependencies(
  dependencies: Record<string, string[]>,
  dependents: Record<string, string[]>
): Record<string, { include: string[]; exclude: string[] }> {
  const result = {};

  const dependentCount = {};

  for (const file in dependents) {
    dependentCount[file] = dependents[file].length;
  }

  for (const file in dependencies) {
    const filesToInclude = [];
    const filesToExclude = [];

    dependencies[file].forEach((dep) => {
      if (dependentCount[dep] > 1) {
        filesToExclude.push(dep);
      } else {
        filesToInclude.push(dep);
      }
    });

    result[file] = {
      include: filesToInclude,
      exclude: filesToExclude,
    };
  }

  return result;
}

export class Compiler {
  options: BuildOptions;

  entryPoints: string[];

  entries: Record<string, string>;

  outdir: string;

  dependencies: Record<string, string[]>;

  dependents: Record<string, string[]>;

  builds: Record<string, { include: string[]; exclude: string[] }>;

  factory: ResolverFactory;

  constructor(entries: Record<string, string>, options?: BuildOptions) {
    this.options = options || {};
    this.entryPoints = Object.keys(entries);
    this.entries = entries;

    if (this.entryPoints.length === 1) {
      warn('This "Compile" feature is not recommended for single entryPoint.');
    }
  }

  analyzeEntries(): void {
    for (const entry of this.entryPoints) {
      const analyzer = new Analyzer(entry, this.options);
      const { dependencies, dependents } = analyzer.analyzeDeps();

      this.dependencies = mergeObjects(this.dependencies, dependencies);
      this.dependents = mergeObjects(this.dependents, dependents);

      if (!this.factory) this.factory = analyzer.factory;
    }

    this.builds = optimizeDependencies(this.dependencies, this.dependents);
  }

  async beforeBuild(): Promise<void> {
    this.analyzeEntries();

    const outdir = this.options.outdir || 'dist';

    this.options.extensions = {
      cjs: this.options.extensions?.cjs || '.js',
      esm: this.options.extensions?.esm || '.mjs',
    };

    if (this.options.clean) {
      rmSync(outdir, { force: true, recursive: true });
    }

    this.outdir = outdir;
  }

  async build(
    id: string,
    options: BuildOptions,
    cache: {
      esm: Map<string, string>;
      cjs: Map<string, string>;
    }
  ): Promise<{
    esm: Map<string, string>;
    cjs: Map<string, string>;
  }> {
    const esbuildOptions = options.buildOptions;
    const deps = {
      dependencies: this.dependencies,
      dependents: this.dependents,
    };
    const resolver = this.factory;
    const { outdir } = this;
    const $ = {
      esm: null,
      cjs: null,
    };

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
              entries: this.entries,
            },
            builds: this.builds,
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
        resetCache(cache[ty as string]); // reset cache

        await esbuild.build({
          ...baseOptions,
          outfile: join(outdir, `${this.entries[id]}${options.extensions[ty] || '.js'}`),
          format: ty,
          plugins: [...userPlugin, createDepPlugin('entry')],
        });

        $[ty as string] = new Map(getCache());
      }
    };

    await build((options.format || ['cjs']) as Format[]);

    return $;
  }

  async compile(): Promise<void> {
    let $: { esm: Map<string, string>; cjs: Map<string, string> } = {
      esm: new Map(),
      cjs: new Map(),
    };
    for await (const entryPoint of this.entryPoints) {
      const target = this.factory.sync(process.cwd(), entryPoint).path;
      if ($.cjs.has(target) || $.esm.get(target)) {
        if ($.cjs.has(target)) {
          writeFileSync(
            join(
              this.outdir,
              `${this.entries[entryPoint]}${this.options.extensions.cjs || '.js'}`
            ),
            `/*cached*/module.exports=require("${joinPath(
              this.options.chunks?.dir || 'chunks',
              $.cjs.get(target)
            )}");`
          );
        }
        if ($.esm.has(target)) {
          writeFileSync(
            join(
              this.outdir,
              `${this.entries[entryPoint]}${this.options.extensions.esm || '.mjs'}`
            ),
            `/*cached*/export * from "${joinPath(
              this.options.chunks?.dir || 'chunks',
              $.esm.get(target)
            )}";`
          );
        }
      } else {
        const cached = await this.build(entryPoint, this.options, $);

        // merge cache

        $ = {
          esm: new Map([...(cached.esm || new Map()), ...$.esm]),
          cjs: new Map([...(cached.cjs || new Map()), ...$.cjs]),
        };
        // console.log($);
      }
    }
  }
}

export async function compile(
  entries: Record<string, string>,
  options?: BuildOptions
): Promise<void> {
  const compiler = new Compiler(entries, options);
  await compiler.beforeBuild();
  await compiler.compile();
}
