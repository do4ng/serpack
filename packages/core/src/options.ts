import esbuild from 'esbuild';
import { NapiResolveOptions } from 'oxc-resolver';

export type Format = 'cjs' | 'esm';

export interface BuildOptions {
  externals?: string[];
  excludeNodeModules?: boolean;
  format?: string[];
  buildOptions?: Omit<
    esbuild.BuildOptions,
    'entryPoints' | 'outfile' | 'outbase' | 'outdir' | 'splitting' | 'format'
  >;
  outdir?: string;
  chunks?: {
    dir?: string;
    /**
     * `id`: random id
     *
     * `index`: index of the chunk
     * @example "chunk-[id]-[index]"
     * @default "[id].[index]"
     */
    name?: string;
  };

  /**
   * remove dist directory before build
   */
  clean?: boolean;

  /**
   * file extension for each formats
   * @default
   * ```json
   * { "cjs": ".js", "esm": ".mjs" }
   * ```
   */
  extensions?: {
    // eslint-disable-next-line no-unused-vars
    [format in Format]?: `.${string}`;
  };

  resolverOptions?: NapiResolveOptions;
}
