import { NapiResolveOptions, ResolverFactory } from "oxc-resolver";
import { BuildOptions } from "$/core/src/options";
export interface FileMeta {
	raw: string;
	imports?: {
		raw: string;
		target: string;
		isDynamic: boolean;
	}[];
	exports?: string[];
}
export declare class Analyzer {
	entryPoint: string;
	entryCode: string;
	files: Record<string, string>;
	filesMeta: Record<string, FileMeta>;
	dependents: Record<string, string[]>;
	dependencies: Record<string, string[]>;
	options: BuildOptions;
	factory: ResolverFactory;
	resolverOptions: NapiResolveOptions;
	constructor(entryPoint: string, options?: BuildOptions);
	checkValidTarget(target: string): boolean;
	analyze(target: string, keep?: boolean): FileMeta;
	analyzeDeps(): {
		dependencies: Record<string, string[]>;
		dependents: Record<string, string[]>;
	};
}
