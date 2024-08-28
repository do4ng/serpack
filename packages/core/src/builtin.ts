import { builtinModules } from 'module';

const builtin: string[] = [...builtinModules, ...builtinModules.map((b) => `node:${b}`)];
export default builtin;
