import { existsSync } from "../deps.ts";
import { GitClient, IssueClient, PullRequestClient } from "../deps.ts";
import { Input, Select } from "../deps.ts";
import runAsync from "./core/run-async.ts";
import { CreatePrSettings } from "./create-pr-settings.ts";
import { Guards } from "./core/guards.ts";
import { ConsoleLogColor } from "./core/console-log-color.ts";

/**
 * Creates pull requests for a project based on settings.
 */
export class PrCreator {
	/**
	 * Creates a new instance of the {@link PrCreator} class.
	 */
	constructor() {
	}

	/**
	 * Creates a pull request using collected information from the user and settings.
	 */
	public async createPr(): Promise<void> {
		const settings = this.getSettings();

		const ownerName = settings.ownerName;
		const repoName = settings.repoName;
		const githubToken = (Deno.env.get(settings.githubTokenEnvVarName) ?? "").trim();
		const baseBranches = settings.baseBranches.map((b) => b.trim());

		const prNumberStr = await Input.prompt({
			message: "Enter an issue number",
			validate: (value) => {
				const chars = [...value];

				return chars.every((char) => {
					return !isNaN(parseInt(char));
				});
			},
			transform: (value) => value.trim(),
		});

		const issueNumber = parseInt(prNumberStr);

		// Issue number validation
		const issueClient = new IssueClient(ownerName, repoName, githubToken);

		ConsoleLogColor.gray(`Checking if issue '#${issueNumber}' exists . . .`);

		const issueExists = await issueClient.issueExists(issueNumber);

		if (issueExists) {
			const issue = await issueClient.getIssue(issueNumber);

			if (issue.state === "closed") {
				const errorMsg = `The issue with number '${issueNumber}' is closed.\nPlease choose another open issue.`;
				ConsoleLogColor.red(errorMsg);
				Deno.exit(1);
			}
		} else {
			const errorMsg = `An issue with number '${issueNumber}' does not exist.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}

		ConsoleLogColor.gray(`Issue '#${issueNumber}' exists.`);

		const chosenHeadBranch = await Input.prompt({
			message: "Enter a head branch name",
			transform: (value) => {
				value = value.trim();
				value = value.toLowerCase();
				value = value.replaceAll("_", "-");
				value = value.replaceAll(" ", "-");
				value = value.startsWith("feature/") ? value : `feature/${issueNumber}-${value}`;

				return value;
			},
		});

		// Head branch validation
		ConsoleLogColor.gray(`Checking that the head branch '${chosenHeadBranch}' does not already exist . . .`);
		const branchRegex = /^feature\/([1-9][0-9]*)-(?!-)[a-z-]+$/gm;

		if (!branchRegex.test(chosenHeadBranch)) {
			const errorMsg =
				`The head branch name '${chosenHeadBranch}' is invalid. It should match the pattern: 'feature/<issue-number>-<branch-name>'`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}

		ConsoleLogColor.gray(`Head branch name '${chosenHeadBranch}' does not exist.`);

		const gitClient = new GitClient(ownerName, repoName, githubToken);

		const headBranchExists = await gitClient.branchExists(chosenHeadBranch);

		if (headBranchExists) {
			const errorMsg = `The head branch '${chosenHeadBranch}' exists in the remote repository.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}

		// Validate that the chosen base branch exists in remote
		const chosenBaseBranch = await Select.prompt({
			message: "Choose a base branch",
			options: baseBranches,
			validate: (branch) => baseBranches.includes(branch),
		});

		ConsoleLogColor.gray(`Checking that the base branch '${chosenBaseBranch}' exists . . .`);
		const branchExists = await gitClient.branchExists(chosenBaseBranch);

		if (!branchExists) {
			const errorMsg = `The branch '${chosenBaseBranch}' does not exist in the remote repository.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}

		ConsoleLogColor.gray(`Base branch '${chosenBaseBranch}' exists.`);

		ConsoleLogColor.gray(`Creating the new head branch '${chosenHeadBranch}' . . .`);
		await runAsync("git", ["checkout", "-B", chosenHeadBranch]);

		ConsoleLogColor.gray(`Creating empty commit . . .`);
		await runAsync("git", ["commit", "--allow-empty", "-m", `Start work for issue #${issueNumber}`]);

		ConsoleLogColor.gray(`Pushing the new head branch '${chosenHeadBranch}' to remote . . .`);
		await runAsync("git", ["push", "--set-upstream", "origin", chosenHeadBranch]);

		ConsoleLogColor.gray(`Creating pull request . . .`);
		const prClient = new PullRequestClient(ownerName, repoName, githubToken);
		const newPr = await prClient.createPullRequest("new pr", chosenHeadBranch, chosenBaseBranch, "", true, true);

		const successMsg = `Pull request created successfully!\nPR: ${newPr.html_url}`;

		ConsoleLogColor.green(successMsg);
	}

	/**
	 * Loads the settings for the script.
	 * @returns The settings.
	 */
	private getSettings(): CreatePrSettings {
		const settingsFileName = "create-pr-settings.json";
		const settingsFilePath = `./dev-tools/${settingsFileName}`;

		if (!existsSync(settingsFilePath, { isFile: true })) {
			const errorMsg = `The settings file '${settingsFileName}' does not exist in the current working directory.`;
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		const settingJsonData = Deno.readTextFileSync(settingsFilePath);
		let settings: CreatePrSettings;

		try {
			settings = JSON.parse(settingJsonData);
		} catch (error) {
			const errorMsg = `There was a problem parsing the file '${settingsFileName}'.\n${error.message}`;
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		if (!this.validSettingsObj(settings)) {
			const errorMsg = `The settings file '${settingsFileName}' does not have the correct properties.` +
				"\nThe required settings are:" +
				"\n\t- ownerName: string" +
				"\n\t- repoName: string" +
				"\n\t- baseBranches: string[]" +
				"\n\t- githubTokenEnvVarName: string";

			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		const githubToken = (Deno.env.get(settings.githubTokenEnvVarName) ?? "").trim();

		if (githubToken === "") {
			ConsoleLogColor.red(`The environment variable '${settings.githubTokenEnvVarName}' is not set.`);
			Deno.exit(1);
		}

		if (Guards.isNothing(settings.ownerName)) {
			const errorMsg = "The owner name is not set.";
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		if (Guards.isNothing(settings.repoName)) {
			const errorMsg = "The repo name is not set.";
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		if (Guards.isNothing(settings.baseBranches)) {
			const errorMsg = "The base branches are not set.";
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		return settings;
	}

	/**
	 * Returns whether the given {@link settingsObj} is a valid {@link CreatePrSettings} object.
	 * @param settingsObj Validates the given {@link settingsObj}.
	 * @returns True if the object is a valid {@link CreatePrSettings} object; otherwise, false.
	 */
	private validSettingsObj(settingsObj: unknown): settingsObj is CreatePrSettings {
		if (settingsObj === null || settingsObj === undefined || typeof settingsObj !== "object") {
			return false;
		}

		const allPropsExist = "ownerName" in settingsObj &&
			"repoName" in settingsObj &&
			"githubTokenEnvVarName" in settingsObj &&
			"baseBranches" in settingsObj;

		if (allPropsExist) {
			return Guards.isNotNothing(settingsObj.ownerName) &&
				Guards.isNotNothing(settingsObj.repoName) &&
				Guards.isNotNothing(settingsObj.githubTokenEnvVarName) &&
				Guards.isNotNothing(settingsObj.baseBranches) &&
				Array.isArray(settingsObj.baseBranches) &&
				settingsObj.baseBranches.every((b) => Guards.isString(b));
		}

		return false;
	}
}
