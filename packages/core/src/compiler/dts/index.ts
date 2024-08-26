import path, { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import transform from 'oxc-transform';
import { Analyzer } from '../../core';

function findCommonBasePath(paths: string[]) {
  if (paths.length === 0) return '';

  paths = paths.map((p) => p.replace(/\\/g, '/'));

  const splitPaths = paths.map((path) => path.split('/'));

  const commonPath: string[] = [];
  for (let i = 0; i < splitPaths[0].length; i += 1) {
    const currentSegment = splitPaths[0][i];

    if (splitPaths.every((path) => path[i] === currentSegment)) {
      commonPath.push(currentSegment);
    } else {
      break;
    }
  }

  return commonPath.join('/');
}

function makeRelativePaths(paths: string[], commonBasePath: string) {
  paths = paths.map((p) => p.replace(/\\/g, '/'));

  const relativePaths = paths.map((path) => {
    if (path.startsWith(commonBasePath)) {
      return path.slice(commonBasePath.length);
    }
    return path;
  });

  return relativePaths.map((path) => (path.startsWith('/') ? path.slice(1) : path));
}

function replaceExtension(filePath: string, newExtension: string) {
  if (!newExtension.startsWith('.')) {
    newExtension = `.${newExtension}`;
  }

  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + newExtension
  );
}

export function generateTypeDeclaration(entry: string, outdir: string): void {
  const analyzer = new Analyzer(entry, {
    excludeNodeModules: true,
  });

  const targets = Object.keys(analyzer.filesMeta);
  const $: Record<string, string> = {};

  for (const target of targets) {
    const output = transform.isolatedDeclaration(target, readFileSync(target).toString());

    if (output.errors.length > 0) {
      console.error(`Error in ${target}:`, output.errors);
    } else {
      $[target] = output.sourceText;
    }
  }

  const base = findCommonBasePath(Object.keys($));
  const outfiles = makeRelativePaths(Object.keys($), base);

  for (const [index, outfile] of outfiles.entries()) {
    const id = join(outdir, replaceExtension(outfile, 'd.ts'));

    // if directory not exists, create
    const dir = path.dirname(id);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(id, $[Object.keys($)[index]]);
  }
}
