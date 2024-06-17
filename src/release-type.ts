/**
 * Represents a release type that would create a release pull request from the head branch to the base branch.
 */
export interface ReleaseType {
	/**
	 * Gets the name of the release type.
	 */
	name: string,

	/**
	 * Gets the pull request reviewer.
	 */
	reviewer?: string,

	/**
	 * Gets the pull request assignee.
	 */
	assignee?: string,

	/**
	 * Gets the head branch for a release pull request.
	 */
	headBranch: string,

	/**
	 * Gets the base branch for a release pull request.
	 */
	baseBranch: string,

	/**
	 * Gets the file path to the generate release settings.
	 */
	genReleaseSettingsFilePath?: string;

	/**
	 * Gets the directory path to the release notes.
	 */
	releaseNotesDirPath: string,

	/**
	 * Gets the path to the template file for the release pull request.
	 */
	releasePrTemplateFilePath: string,

	/**
	 * Gets the labels to use in the release pull request.
	 */
	releaseLabels: string[],

	/**
	 * Gets the title of the pull request.
	 */	
	prTitle: string,
}
