/**
 * Settings for the deno build script.
 */
export interface DenoBuildSettings {
	/**
	 * Gets the list of regex patterns to ignore.
	 */
	ignoreExpressions: string[];
}
