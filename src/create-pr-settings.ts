/**
 * Settings for creating a pull request script.
 */
export interface CreatePrSettings {
	/**
	 * Gets the name of the repository owner.
	 */
	ownerName: string;

	/**
	 * Gets the name of the repository.
	 */
	repoName: string;

	/**
	 * Gets the name of the environment variable for the GitHub token to use for authentication.
	 */
	githubTokenEnvVarName: string;

	/**
	 * Gets the list of base branches to choose from when creating a pull request.
	 */
	baseBranches: string[];
}
