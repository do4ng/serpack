import { Plugin, BuildOptions as esbuildBuildOptions } from "esbuild";
import { ResolverFactory } from "oxc-resolver";
import { BuildOptions } from "../../options";
export declare function resetCache(): void;
export declare function depsPlugin(kit: {
	deps: {
		dependencies: Record<string, string[]>;
		dependents: Record<string, string[]>;
	};
	resolver: ResolverFactory;
	build: (target: string, output: string, initialOptions: esbuildBuildOptions) => Promise<any>;
	paths: {
		entry: string;
		chunks: string;
	};
	options: BuildOptions;
}, type?: "chunk" | "entry"): Plugin;
