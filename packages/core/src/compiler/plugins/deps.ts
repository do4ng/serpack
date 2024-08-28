/* eslint-disable no-unused-vars */
/* eslint-disable no-nested-ternary */
import { Plugin, BuildOptions as esbuildBuildOptions } from 'esbuild';
import { join } from 'path';
import { ResolverFactory } from 'oxc-resolver';
import { BuildOptions } from '../../options';
import builtin from '../../builtin';

let cache = new Map<string, string>();

export const joinPath = (a: string, b: string) => {
  a = a.replace(/\\/g, '/');
  b = b.replace(/\\/g, '/');

  const pretty = (target: string) => {
    if (target.startsWith('./')) target = target.slice(2);
    if (target.endsWith('/')) target = target.slice(0, -1);
    if (target.startsWith('/')) target = target.slice(1);
    return `${target}`;
  };

  a = pretty(a);
  b = pretty(b);

  return `./${a}${a.length === 0 ? '' : '/'}${b}`;
};

export function resetCache(initial?: Map<string, string>): void {
  cache.clear();
  if (initial) cache = initial;
}

export function getCache(): Map<string, string> {
  return cache;
}

export function depsPlugin(
  kit: {
    deps: {
      dependencies: Record<string, string[]>;
      dependents: Record<string, string[]>;
    };
    resolver: ResolverFactory;
    build: (
      target: string,
      output: string,
      initialOptions: esbuildBuildOptions
    ) => Promise<any>;
    builds: Record<string, { include: string[]; exclude: string[] }>;
    paths: {
      entries: Record<string, string>;
    };
    options: BuildOptions;
  },
  type: 'chunk' | 'entry' = 'chunk'
): Plugin {
  const generateChunk = (format: 'esm' | 'cjs' = 'cjs') => {
    if (!['esm', 'cjs'].includes(format)) throw new Error(`Invalid format ${format}`);

    const index = cache.size;
    const id = (Math.random() + 1).toString(36).substring(7);

    const extension = kit.options.extensions[format];

    const style = kit.options?.chunks?.name || '[id][index]'; // [index]: 중복방지

    return `${style
      .replace(/\[id\]/g, id)
      .replace(/\[index\]/g, index.toString())}${extension}`;
  };

  return {
    name: 'mately/deps-plugin',
    async setup(build) {
      const entry = kit.resolver.sync(
        process.cwd(),
        build.initialOptions.entryPoints[0]
      ).path;
      const excludedDependencies = kit.builds[entry].exclude || [];

      build.onResolve({ filter: /.*/ }, async (args) => {
        // node: as external
        if (builtin.includes(args.path)) {
          return { path: args.path, external: true };
        }

        const { path: resolved, error } = kit.resolver.sync(args.resolveDir, args.path);

        if (error) {
          throw error;
        }

        // node_modules as external

        if (resolved.replace(/\\/g, '/').includes('/node_modules')) {
          return { path: args.path, external: true };
        }

        // DEBUG: console.log(`resolving ${resolved} as ${type} ${args.importer}`);

        // entry point

        if (resolved === entry) {
          return;
        }

        const prefix =
          type === 'chunk'
            ? './'
            : kit.options?.chunks?.dir
            ? kit.options?.chunks?.dir
            : './chunks/';

        // resolve chunks

        if (!excludedDependencies.includes(resolved)) {
          return { external: false };
        }

        // is already compiled

        if (cache.has(resolved)) {
          return { path: joinPath(prefix, cache.get(resolved)), external: true };
        }

        cache.set(resolved, generateChunk(build.initialOptions.format as any));

        const output = join(
          kit.options?.chunks?.dir ? kit.options?.chunks?.dir : './chunks/',
          cache.get(resolved)
        );

        await kit.build(resolved, output, build.initialOptions);

        return {
          external: true,
          path: joinPath(prefix, cache.get(resolved)),
        };
      });
    },
  };
}
