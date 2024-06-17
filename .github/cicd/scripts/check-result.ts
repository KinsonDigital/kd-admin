/**
 * Represents the result of checking a file.
 */
export interface CheckResult {
	/**
	 * The file being checked.
	 */
	file: string;

	/**
	 * The output result of the check.
	 */
	result: string;

	/**
	 * True if the check has passed, false otherwise.
	 */
	hasPassed: boolean;
}
