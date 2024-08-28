import esbuild from "esbuild";
import { NapiResolveOptions } from "oxc-resolver";
export type Format = "cjs" | "esm";
export interface BuildOptions {
	externals?: string[];
	excludeNodeModules?: boolean;
	format?: string[];
	buildOptions?: Omit<esbuild.BuildOptions, "entryPoints" | "outfile" | "outbase" | "outdir" | "splitting" | "format">;
	outdir?: string;
	chunks?: {
		dir?: string;
		name?: string;
	};
	clean?: boolean;
	extensions?: { [format in Format]? : `.${string}`};
	resolverOptions?: NapiResolveOptions;
}
