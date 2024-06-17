/**
 * Various options to use when running deno checks against files.
 */
export interface CheckOptions {
	/**
	 * Whether to resolve npm modules.
	 */
	noNpm?: boolean;

	/**
	 * Whether to disable auto discovery of the lock file.
	 */
	noLock?: boolean;

	/**
	 * List of regular expression patterns used to filter entries.
	 * If specified, entries matching the patterns specified by this option are excluded.
	 */
	skip?: RegExp[];
}
