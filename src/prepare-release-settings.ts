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
	 * Gets the name of the organization project.
	 */
	orgProjectName?: string;

	/**
	 * Gets the list of release types.
	 */
	releaseTypes: ReleaseType[];

	/**
	 * Gets the name of the name of the environment name for the GitHub token.
	 */
	githubTokenEnvVarName: string;
}
