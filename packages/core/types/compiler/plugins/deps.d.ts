import { Plugin, BuildOptions as esbuildBuildOptions } from "esbuild";
import { ResolverFactory } from "oxc-resolver";
import { BuildOptions } from "../../options";
export declare const joinPath: (a: string, b: string) => string;
export declare function resetCache(initial?: Map<string, string>): void;
export declare function getCache(): Map<string, string>;
export declare function depsPlugin(kit: {
	deps: {
		dependencies: Record<string, string[]>;
		dependents: Record<string, string[]>;
	};
	resolver: ResolverFactory;
	build: (target: string, output: string, initialOptions: esbuildBuildOptions) => Promise<any>;
	builds: Record<string, {
		include: string[];
		exclude: string[];
	}>;
	paths: {	entries: Record<string, string>};
	options: BuildOptions;
}, type?: "chunk" | "entry"): Plugin;
