import { ReleaseType } from "./release-type.ts";

/**
 * Represents the different settings.
 */
export interface PrepareReleaseSettings {
	/**
	 * Gets the owner of the repository.
	 */
	ownerName: string;

	/**
	 * Gets the name of the repository.
	 */
	repoName: string;

	/**
	 * Gets the list of release types.
	 */
	releaseTypes: ReleaseType[];

	/**
	 * Gets the name of the name of the environment name for the GitHub token.
	 */
	githubTokenEnvVarName: string;

	/**
	 * Gets the name of the organization project.
	 */
	orgProjectName?: string;

	/**
	 * Gets the full or relative file path to the version file.
	 * @remarks If undefined, null, or empty, then the version will not be updated.
	 */
	versionFilePath?: string;

	/**
	 * Gets the dot separated path to the JSON key that contains the version.
	 */
	versionJSONKeyPath?: string;

	/**
	 * Gets the value to prefix the release notes file name with.
	 */
	releaseNotesFilePrefix?: string;
}
