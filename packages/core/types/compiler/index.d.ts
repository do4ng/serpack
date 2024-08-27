import type { ResolverFactory } from "oxc-resolver";
import { BuildOptions } from "../options";
export declare class Compiler {
	options: BuildOptions;
	entryPoints: string[];
	entries: Record<string, string>;
	outdir: string;
	dependencies: Record<string, string[]>;
	dependents: Record<string, string[]>;
	builds: Record<string, {
		include: string[];
		exclude: string[];
	}>;
	factory: ResolverFactory;
	constructor(entries: Record<string, string>, options?: BuildOptions);
	analyzeEntries(): void;
	beforeBuild(): Promise<void>;
	build(id: string, options: BuildOptions, cache: {
		esm: Map<string, string>;
		cjs: Map<string, string>;
	}): Promise<{
		esm: Map<string, string>;
		cjs: Map<string, string>;
	}>;
	compile(): Promise<void>;
}
export declare function compile(entries: Record<string, string>, options?: BuildOptions): Promise<void>;
