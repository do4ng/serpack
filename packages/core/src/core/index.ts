import { readFileSync } from 'fs';
import { dirname } from 'path';

import { moduleLexerSync } from 'oxc-parser';
import { NapiResolveOptions, ResolverFactory } from 'oxc-resolver';

import { BuildOptions } from '$/core/src/options';
import builtin from '../builtin';
import { debug } from '../logger';

export interface FileMeta {
  raw: string;
  imports?: { raw: string; target: string; isDynamic: boolean }[];
  exports?: string[];
}

export class Analyzer {
  entryPoint: string;

  entryCode: string;

  files: Record<string, string>;

  filesMeta: Record<string, FileMeta>;

  dependents: Record<string, string[]>;

  dependencies: Record<string, string[]>;

  options: BuildOptions;

  factory: ResolverFactory;

  resolverOptions: NapiResolveOptions;

  constructor(entryPoint: string, options?: BuildOptions) {
    this.options = options || {};

    this.resolverOptions = this.options?.resolverOptions || {};
    this.factory = new ResolverFactory({
      conditionNames: ['node', 'import'],
      mainFields: ['module', 'main'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      ...this.resolverOptions,
    });

    this.entryPoint = this.factory.sync(process.cwd(), entryPoint).path;
    this.entryCode = readFileSync(this.entryPoint).toString();
    this.files = {
      [this.entryPoint]: this.entryCode,
    };
    this.filesMeta = {};
    this.filesMeta = {
      [this.entryPoint]: this.analyze(this.entryPoint),
    };

    this.dependents = {};
  }

  checkValidTarget(target: string): boolean {
    // exclude node_modules
    if (
      this.options.excludeNodeModules === true &&
      target.replace(/\\/g, '/').includes('/node_modules/')
    ) {
      return false;
    }

    // exclude options.externals
    if (this.options.externals && this.options.externals.includes(target)) {
      return false;
    }

    return true;
  }

  /**
   * Analyze typescript file to derive imports, exports, dependencies and dependents
   * @param target file path
   */
  analyze(target: string, keep: boolean = true): FileMeta {
    // cache
    if (this.filesMeta[target] && Object.hasOwn(this.filesMeta[target], 'imports')) {
      return this.filesMeta[target];
    }

    const fileCode = readFileSync(target).toString();
    const parsed = moduleLexerSync(fileCode, {
      sourceFilename: target,
    });

    this.files[target] = fileCode;

    const $: FileMeta = {
      imports: [],
      exports: [],
      raw: fileCode,
    };

    for (const importer of parsed.imports) {
      const $importer = {
        module: importer.n,
        raw: fileCode.slice(importer.s, importer.e),
        isDynamic: !importer.n,
        target: '',
      };

      if (builtin.includes($importer.module)) {
        $importer.target = $importer.raw;
      } else if (!$importer.isDynamic) {
        const resolved = this.factory.sync(dirname(target), $importer.module);

        if (resolved.error) {
          throw new Error(
            `Error occured while resolving ${$importer.module} - ${resolved.error}`
          );
        }

        $importer.target = resolved.path;

        if (keep && this.checkValidTarget($importer.target)) {
          this.analyze($importer.target, keep);
        }
      } else {
        $importer.target = $importer.raw.slice(1, -1);
      }

      $.imports.push({
        raw: $importer.raw,
        target: $importer.target,
        isDynamic: $importer.isDynamic,
      });
    }

    this.filesMeta[target] = $;

    return this.filesMeta[target];
  }

  analyzeDeps(): {
    dependencies: Record<string, string[]>;
    dependents: Record<string, string[]>;
  } {
    this.dependencies = {};
    this.dependents = {};

    for (const file of Object.keys(this.filesMeta)) {
      const $ = this.filesMeta[file];

      if (!this.dependencies[file]) this.dependencies[file] = [];
      if (!this.dependents[file]) this.dependents[file] = [];

      this.dependencies[file].push(...$.imports.map((i) => i.target));

      for (const dep of this.dependencies[file]) {
        if (!this.dependents[dep]) this.dependents[dep] = [];
        this.dependents[dep].push(file);
      }
    }

    debug(
      `[serpack/analyzer]\n${JSON.stringify(
        {
          dependencies: this.dependencies,
          dependents: this.dependents,
          totalFiles: Object.keys(this.filesMeta).length,
        },
        undefined,
        2
      )}`
    );

    return {
      dependencies: this.dependencies,
      dependents: this.dependents,
    };
  }
}
