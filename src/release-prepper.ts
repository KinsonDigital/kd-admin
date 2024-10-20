import {
	existsSync,
	extname,
	LabelClient,
	MilestoneClient,
	OrgClient,
	ProjectClient,
	PullRequestClient,
	RepoClient,
	TagClient,
} from "../deps.ts";
import { Input, Select } from "../deps.ts";
import { ConsoleLogColor } from "./core/console-log-color.ts";
import { IssueOrPRRequestData } from "../deps.ts";
import runAsync from "./core/run-async.ts";
import { Guards } from "./core/guards.ts";
import { PrepareReleaseSettings } from "./prepare-release-settings.ts";
import { ReleaseType } from "./release-type.ts";
import { ReleaseNotesGenerator } from "./release-notes-generator.ts";
import { GeneratorSettings } from "./generator-settings.ts";
import { JsonVersionUpdater } from "./json-version-updater.ts";
import { CSharpVersionUpdater } from "./csharp-version-updater.ts";
import { resolve } from "../deps.ts";

/**
 * Prepares for a release by creating various branches, release notes, updating the version, and creating a pr.
 */
export class ReleasePrepper {
	private readonly settings: PrepareReleaseSettings;
	private readonly ownerName: string;
	private readonly repoName: string;
	private readonly token: string;
	private readonly prClient: PullRequestClient;
	private readonly repoClient: RepoClient;
	private readonly labelClient: LabelClient;
	private readonly projectClient: ProjectClient;
	private readonly milestoneClient: MilestoneClient;
	private readonly tagClient: TagClient;
	private readonly orgClient: OrgClient;

	/**
	 * Creates a new instance of the {@link ReleasePrepper} class.
	 */
	constructor() {
		this.settings = this.getSettings();
		this.ownerName = this.settings.ownerName;
		this.repoName = this.settings.repoName;
		this.token = (Deno.env.get(this.settings.githubTokenEnvVarName) ?? "").trim();

		this.repoClient = new RepoClient(this.ownerName, this.repoName, this.token);
		this.prClient = new PullRequestClient(this.settings.ownerName, this.settings.repoName, this.token);
		this.labelClient = new LabelClient(this.settings.ownerName, this.settings.repoName, this.token);
		this.projectClient = new ProjectClient(this.settings.ownerName, this.settings.repoName, this.token);
		this.milestoneClient = new MilestoneClient(this.settings.ownerName, this.settings.repoName, this.token);
		this.tagClient = new TagClient(this.settings.ownerName, this.settings.repoName, this.token);
		this.orgClient = new OrgClient(this.settings.ownerName, this.token);
	}

	/**
	 * Prepares for a release.
	 */
	public async prepareForRelease(): Promise<void> {
		const settings: PrepareReleaseSettings = this.getSettings();

		const ownerName = settings.ownerName;
		const repoName = settings.repoName;

		const releaseTypeNames = settings.releaseTypes.map((type: ReleaseType) => type.name);

		const chosenTypeName = await Select.prompt<string>({
			message: "Please choose the type of release",
			options: releaseTypeNames,
		});

		const chosenReleaseType = settings.releaseTypes.find((type: ReleaseType) => type.name === chosenTypeName);

		if (chosenReleaseType === undefined) {
			const errorMsg = `There was a problem choosing a release type.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}

		const chosenVersion = await this.getAndValidateVersion(settings);

		const repoDoesNotExist = !(await this.repoClient.exists());

		if (repoDoesNotExist) {
			const errorMsg = `The repository '${ownerName}/${repoName}' does not exist.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}

		this.validatePrTemplate(chosenReleaseType);

		const prReviewer = Guards.isNothing(chosenReleaseType.reviewer) ? await this.getReviewer() : chosenReleaseType.reviewer;

		const selectedAssignee = Guards.isNothing(chosenReleaseType.assignee)
			? await this.getAssignee()
			: chosenReleaseType.reviewer;

		const [labelsExist, invalidLabels] = await this.getValidateLabels(chosenReleaseType.releaseLabels);

		if (!labelsExist) {
			const errorMsg = `The following labels do not exist in the repository:\n` +
				invalidLabels.map((label) => ` - ${label}`).join("\n") +
				"\nThe pr labels will be left empty.⚠️";

			ConsoleLogColor.red(errorMsg);

			Deno.exit(1);
		}

		const orgProject = Guards.isNothing(settings.orgProjectName) ? await this.getProject() : settings.orgProjectName;
		const orgProjectExists = await this.projectExists(orgProject);

		const milestoneDoesNotExist = !(await this.milestoneExists(chosenVersion));

		if (milestoneDoesNotExist) {
			const warning = `A milestone with the name '${chosenVersion}' does not exist.`;
			ConsoleLogColor.red(warning);
			Deno.exit(1);
		}

		if (Guards.isNothing(settings.versionFilePath)) {
			const warningMsg = "The 'versionFilePath' setting is not set.  The version will not be updated.";
			ConsoleLogColor.yellow(warningMsg);
		} else {
			// Validate version file exists
			const versionFileExists = existsSync(settings.versionFilePath, { isFile: true });

			if (!versionFileExists) {
				const errorMsg = `The version file '${settings.versionFilePath}' does not exist.`;
				ConsoleLogColor.red(errorMsg);
				Deno.exit(1);
			}
		}

		await this.createReleaseBranch(chosenReleaseType);

		if (!Guards.isNothing(settings.versionFilePath)) {
			try {
				this.updateVersion(settings, chosenVersion);
			} catch (error) {
				ConsoleLogColor.red(error.message);
			}

			// Stage version update
			ConsoleLogColor.gray("   ⏳Staging version update.");
			await this.stageFile(resolve(Deno.cwd(), settings.versionFilePath));

			// Commit version update
			ConsoleLogColor.gray("   ⏳Creating version update commit.");
			await this.createCommit(`release: update version to ${chosenVersion}`);
		}

		// Generate the release notes
		const newNotesFilePath = await this.createReleaseNotes(
			chosenReleaseType,
			chosenVersion,
			settings.githubTokenEnvVarName,
			settings.releaseNotesFilePrefix,
		);

		// If release notes were generated, stage and commit them.
		if (newNotesFilePath !== undefined) {
			ConsoleLogColor.gray("   ⏳Staging release notes.");
			await this.stageFile(newNotesFilePath);

			ConsoleLogColor.gray("   ⏳Creating release notes commit.");
			await this.createCommit(`release: create release notes for version ${chosenVersion}`);
		}

		await this.pushToRemote(chosenReleaseType.headBranch);

		const prNumber = await this.createPullRequest(chosenReleaseType, chosenVersion);

		// If a reviewer was selected, assign the pr to the selected reviewer
		if (prReviewer !== undefined) {
			ConsoleLogColor.gray(`   ⏳Setting pr reviewer to '${prReviewer}'.`);
			await this.prClient.requestReviewers(prNumber, prReviewer);
		} else {
			const errorMsg = `A reviewer has not been chosen. The pr will be left unassigned.`;
			ConsoleLogColor.yellow(`⚠️${errorMsg}⚠️`);
		}

		// If an assignee was selected, assign the pr to the selected assignee
		if (selectedAssignee !== undefined) {
			await this.setAssignee(prNumber, selectedAssignee);
		}

		await this.setLabels(prNumber, chosenReleaseType.releaseLabels);

		// Assign the pr to the org project
		if (orgProjectExists) {
			await this.assignToProject(prNumber, orgProject);
		} else {
			const errorMsg = `The project '${orgProject}' does not exist.  The pr will not be assigned to a project.`;
			ConsoleLogColor.yellow(`⚠️${errorMsg}⚠️`);
		}

		// Assignee milestone to the pr
		const milestoneTitle = chosenVersion.startsWith("v") ? chosenVersion : `v${chosenVersion}`;
		const milestone = await this.milestoneClient.getMilestoneByName(milestoneTitle);
		const prData: IssueOrPRRequestData = {
			milestone: milestone.number,
		};

		ConsoleLogColor.gray(`   ⏳Assigning pr to milestone '${milestoneTitle}'.`);
		await this.prClient.updatePullRequest(prNumber, prData);

		const prUrl = `https://github.com/${ownerName}/${repoName}/pull/${prNumber}`;
		ConsoleLogColor.green(`\nPull Request: ${prUrl}`);
	}

	/**
	 * Updates the version in the version file at the given {@link versionFilePath} to the given {@link newVersion}.
	 * @param settings The prepare release settings.
	 * @param newVersion The new version.
	 */
	private updateVersion(settings: PrepareReleaseSettings, newVersion: string) {
		const versionFilePath = settings.versionFilePath ?? "";

		const extension = extname(versionFilePath).toLowerCase().trim();
		newVersion = newVersion.trim();

		switch (extension) {
			case ".json": {
				const jsonUpdater = new JsonVersionUpdater();
				jsonUpdater.updateVersion(settings, newVersion);
				break;
			}
			case ".csproj": {
				const csharpUpdater = new CSharpVersionUpdater();
				csharpUpdater.updateVersion(settings, newVersion);
				break;
			}
			default: {
				const errorMsg = `The file extension '${extension}' is not supported.`;
				ConsoleLogColor.red(errorMsg);
				Deno.exit(1);
			}
		}
	}

	/**
	 * Gets the settings if a 'prepare-release-settings.json' file exists in the current working directory.
	 * @returns The settings.
	 */
	private getSettings(): PrepareReleaseSettings {
		const settingsFileName = "prepare-release-settings.json";
		const settingsFilePath = `./dev-tools/${settingsFileName}`;

		if (!existsSync(settingsFilePath, { isFile: true })) {
			const errorMsg = `The settings file '${settingsFileName}' does not exist in the current working directory.`;
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		const settingJsonData = Deno.readTextFileSync(settingsFilePath);
		let settings: PrepareReleaseSettings;

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
				"\n\t- repoOwner: string" +
				"\n\t- repoName: string" +
				"\n\t- releaseTypes: { name: string, headBranch: string, baseBranch: string }[]" +
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

		return settings;
	}

	/**
	 * Returns a value indicating if the given settings object is valid.
	 * @param settings The settings object to validate.
	 * @returns True if the settings object is valid; otherwise, false.
	 */
	private validSettingsObj(settings: unknown): settings is PrepareReleaseSettings {
		if (settings === null || typeof settings !== "object") {
			return false;
		}

		const settingsObj = settings as PrepareReleaseSettings;

		if (Guards.isNothing(settingsObj.ownerName)) {
			return false;
		}

		if (Guards.isNothing(settingsObj.repoName)) {
			return false;
		}

		if (Guards.isNothing(settingsObj.githubTokenEnvVarName)) {
			return false;
		}

		if (Guards.isNothing(settingsObj.releaseTypes)) {
			return false;
		}

		if (!Array.isArray(settingsObj.releaseTypes)) {
			return false;
		}

		for (let i = 0; i < settingsObj.releaseTypes.length; i++) {
			const releaseType = settingsObj.releaseTypes[i];

			if (!this.validReleaseTypeObj(releaseType)) {
				return false;
			}
		}

		if (settingsObj.repoName !== undefined && typeof settingsObj.repoName !== "string") {
			return false;
		}

		if (settingsObj.orgProjectName !== undefined && typeof settingsObj.orgProjectName !== "string") {
			return false;
		}

		return true;
	}

	/**
	 * Returns a value indicating if the given release type object is valid.
	 * @param releaseType The release type object to validate.
	 * @returns True if the release type object is valid; otherwise, false.
	 */
	private validReleaseTypeObj(releaseType: unknown): releaseType is ReleaseType {
		if (releaseType === null || typeof releaseType === undefined || typeof releaseType !== "object") {
			return false;
		}

		const releaseTypeObj = releaseType as ReleaseType;

		if (Guards.isNothing(releaseTypeObj.name)) {
			return false;
		}

		if (Guards.isNothing(releaseTypeObj.headBranch)) {
			return false;
		}

		if (Guards.isNothing(releaseTypeObj.baseBranch)) {
			return false;
		}

		if (Guards.isNothing(releaseTypeObj.releaseNotesDirPath)) {
			return false;
		}

		if (Guards.isNothing(releaseTypeObj.releasePrTemplateFilePath)) {
			return false;
		}

		if (Guards.isNothing(releaseTypeObj.releaseLabels)) {
			return false;
		}

		if (Guards.isNothing(releaseTypeObj.prTitle)) {
			return false;
		}

		if (releaseTypeObj.reviewer !== undefined && typeof releaseTypeObj.reviewer !== "string") {
			return false;
		}

		if (releaseTypeObj.assignee !== undefined && typeof releaseTypeObj.assignee !== "string") {
			return false;
		}

		if (
			releaseTypeObj.genReleaseSettingsFilePath !== undefined &&
			typeof releaseTypeObj.genReleaseSettingsFilePath !== "string"
		) {
			return false;
		}

		return true;
	}

	/**
	 * Gets the version from the user and trims and validates the version.
	 * @param settings The prepare release settings.
	 * @returns The validated and trimmed version.
	 */
	private async getAndValidateVersion(settings: PrepareReleaseSettings): Promise<string> {
		let chosenVersion = "";

		let versionExists = true;
		while (versionExists) {
			chosenVersion = await Input.prompt({
				message: `Please enter a version`,
				validate: (value) => {
					const isValid = /^(v|)([1-9]\d*|0)\.([1-9]\d*|0)\.([1-9]\d*|0)(-preview\.([1-9]\d*)?|)$/.test(value);

					if (!isValid) {
						const errorMsg = `The version '${value}' does not meet the required syntax requirements.`;
						ConsoleLogColor.red(errorMsg);
					}

					return isValid;
				},
				transform: (value) => value.startsWith("v") ? value : `v${value}`.trim(),
			});

			const tags = (await this.tagClient.getAllTags()).map((tag) => tag.name.trim());

			if (tags.includes(chosenVersion)) {
				const errorMsg = `The version '${chosenVersion}' already exists.`;
				ConsoleLogColor.red(errorMsg);
				versionExists = true;
			} else {
				versionExists = false;
			}
		}

		// Trim the starting section of the version if trim values exist
		if (!Guards.isNothing(settings.trimFromStartOfVersion)) {
			for (let i = 0; i < settings.trimFromStartOfVersion.length; i++) {
				const trimValue = settings.trimFromStartOfVersion[i];

				if (chosenVersion.startsWith(trimValue)) {
					chosenVersion = chosenVersion.slice(trimValue.length);
				}
			}
		}

		return chosenVersion;
	}

	/**
	 * Creates a release branch based on the given {@link releaseType}.
	 * @param releaseType The type of release.
	 */
	private async createReleaseBranch(releaseType: ReleaseType): Promise<void> {
		const createBranchResult = await runAsync("git", ["checkout", "-B", releaseType.headBranch]);

		if (createBranchResult instanceof Error) {
			ConsoleLogColor.red(createBranchResult.message);
			Deno.exit(1);
		}
	}

	/**
	 * Creates release notes based on the given {@link releaseType} and {@link chosenVersion}.
	 * @param releaseType The type of release.
	 * @param chosenVersion The version.
	 * @param tokenEnvVarName The name of the environment variable that contains the GitHub token.
	 * @param fileNamePrefix The value to prefix the notes file name with.
	 * @returns The release notes.
	 */
	private async createReleaseNotes(
		releaseType: ReleaseType,
		chosenVersion: string,
		tokenEnvVarName: string,
		fileNamePrefix?: string,
	): Promise<string | undefined> {
		ConsoleLogColor.gray("   ⏳Creating release notes.");

		// Trim the notes dir path and replace all '\' with '/'
		let notesDirPath = releaseType.releaseNotesDirPath.trim().replace(/\\/g, "/");

		notesDirPath = notesDirPath.endsWith("/") ? notesDirPath.slice(0, -1) : notesDirPath;
		chosenVersion = chosenVersion.startsWith("v") ? chosenVersion : `v${chosenVersion}`;

		const settings = this.loadGenNotesSettings(releaseType, chosenVersion, tokenEnvVarName);

		if (settings === undefined) {
			return undefined;
		}

		const generator = new ReleaseNotesGenerator();

		const releaseNotesFileContent = await generator.generateNotes(settings);

		// If the release notes directory does not exist, create it
		if (!existsSync(notesDirPath, { isDirectory: true, isFile: false })) {
			Deno.mkdirSync(notesDirPath, { recursive: true });
		}

		const prefix = Guards.isNothing(fileNamePrefix) ? "" : fileNamePrefix;

		const newNotesFilePath = `${notesDirPath}/${prefix}${chosenVersion}.md`;

		Deno.writeTextFileSync(newNotesFilePath, releaseNotesFileContent, { create: true });

		return newNotesFilePath;
	}

	private loadGenNotesSettings(
		releaseType: ReleaseType,
		version: string,
		tokenEnvVarName: string,
	): GeneratorSettings | undefined {
		if (releaseType.genReleaseSettingsFilePath === undefined) {
			const warningMsg = `The 'genReleaseSettingsFilePath' setting for release type '${releaseType.name}' is not set` +
				"\nand the 'generate release notes' process will be skipped." +
				"\nPlease set the 'genReleaseSettingsFilePath' property in the release type settings.";
			ConsoleLogColor.yellow(warningMsg);

			return undefined;
		}

		if (!existsSync(releaseType.genReleaseSettingsFilePath)) {
			const warningMsg = `The release notes settings file '${releaseType.genReleaseSettingsFilePath}' does not exist.` +
				"\nand the 'generate release notes' process will be skipped." +
				"\nPlease set the 'genReleaseSettingsFilePath' property in the release type settings.";
			ConsoleLogColor.yellow(warningMsg);

			return undefined;
		}

		const settingJsonData = Deno.readTextFileSync(releaseType.genReleaseSettingsFilePath);

		let settings: GeneratorSettings;

		try {
			settings = JSON.parse(settingJsonData);
		} catch (error) {
			const errorMsg =
				`There was a problem parsing the file '${releaseType.genReleaseSettingsFilePath}'.\n${error.message}`;
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		settings.version = version;
		settings.githubTokenEnvVarName = tokenEnvVarName;

		return settings;
	}

	/**
	 * Stages the given {@link newNotesFilePath} file.
	 * @param newNotesFilePath The file to stage.
	 */
	private async stageFile(newNotesFilePath: string): Promise<void> {
		const stageResult = await runAsync("git", ["add", newNotesFilePath]);

		if (stageResult instanceof Error) {
			const errorMsg = `There was an error staging the release notes file '${newNotesFilePath}'\n${stageResult.message}.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Creates a commit with the given {@link commitMsg}.
	 * @param newNotesFilePath The file to commit.
	 * @param commitMsg The commit message.
	 */
	private async createCommit(commitMsg: string): Promise<void> {
		const createCommitResult = await runAsync("git", [
			"commit",
			"-m",
			commitMsg,
		]);

		if (createCommitResult instanceof Error) {
			const errorMsg =
				`There was an error creating the commit with the message '${commitMsg}'\n${createCommitResult.message}.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(1);
		}
	}

	private async pushToRemote(branch: string): Promise<void> {
		ConsoleLogColor.gray("   ⏳Pushing to remote.");
		const pushToOriginResult = await runAsync("git", ["push", "--set-upstream", "origin", branch]);

		if (pushToOriginResult instanceof Error) {
			ConsoleLogColor.red(pushToOriginResult.message);
			Deno.exit(1);
		}
	}

	private async getReviewer(): Promise<string | undefined> {
		type AssignInputType = "manual" | "org members only" | "ignore";
		const assignOptions: AssignInputType[] = ["org members only", "manual", "ignore"];

		const selectedAssignType = <AssignInputType> (await Select.prompt({
			message: "Choose the type of reviewer member",
			options: assignOptions,
		}));

		let selectedAssignee = "";

		ConsoleLogColor.gray("   ⏳Fetching org members");
		const allOrgMembers = await this.orgClient.getAllOrgMembers();

		if (selectedAssignType === "org members only") {
			const memberNames = allOrgMembers.map((member) => member.login);

			selectedAssignee = await Select.prompt({
				message: "Choose an assignee",
				options: memberNames,
				search: true,
				validate: (loginName) => {
					const memberExists = allOrgMembers.find((member) => member.login === loginName);

					if (memberExists === undefined) {
						ConsoleLogColor.red(`The assignee '${loginName}' does not exist.`);
						return false;
					}

					return true;
				},
			});
		} else if (selectedAssignType === "manual") {
			selectedAssignee = await Input.prompt({
				message: "Enter the GitHub login name",
				validate: (loginName) => {
					loginName = loginName.trim();

					if (loginName.length <= 0) {
						ConsoleLogColor.red("The assignee cannot be empty.");
						return false;
					}

					const memberExists = allOrgMembers.find((member) => member.login === loginName);

					if (memberExists === undefined) {
						ConsoleLogColor.red(`The assignee '${loginName}' does not exist.`);
						return false;
					}

					return true;
				},
				transform: (value) => value.trim(),
			});
		} else {
			return undefined;
		}

		return selectedAssignee;
	}

	private async getAssignee(): Promise<string | undefined> {
		type AssignInputType = "manual" | "org members only" | "ignore";
		const assignOptions: AssignInputType[] = ["org members only", "manual", "ignore"];

		const selectedAssignType = <AssignInputType> (await Select.prompt({
			message: "Choose the type of assignee member",
			options: assignOptions,
		}));

		let selectedAssignee = "";

		ConsoleLogColor.gray("   ⏳Fetching org members");
		const allOrgMembers = await this.orgClient.getAllOrgMembers();

		if (selectedAssignType === "org members only") {
			const memberNames = allOrgMembers.map((member) => member.login);

			selectedAssignee = await Select.prompt({
				message: "Choose an assignee",
				options: memberNames,
				search: true,
				validate: (loginName) => {
					const memberExists = allOrgMembers.find((member) => member.login === loginName);

					if (memberExists === undefined) {
						ConsoleLogColor.red(`The assignee '${loginName}' does not exist.`);
						return false;
					}

					return true;
				},
			});
		} else if (selectedAssignType === "manual") {
			selectedAssignee = await Input.prompt({
				message: "Enter the GitHub login name",
				validate: (loginName) => {
					loginName = loginName.trim();

					if (loginName.length <= 0) {
						ConsoleLogColor.red("The assignee cannot be empty.");
						return false;
					}

					const memberExists = allOrgMembers.find((member) => member.login === loginName);

					if (memberExists === undefined) {
						ConsoleLogColor.red(`The assignee '${loginName}' does not exist.`);
						return false;
					}

					return true;
				},
				transform: (value) => value.trim(),
			});
		} else {
			return undefined;
		}

		return selectedAssignee;
	}

	private async getValidateLabels(labels: string[]): Promise<[boolean, string[]]> {
		// Validate that the label exists
		ConsoleLogColor.gray("   ⏳Validating labels.");
		const prLabels = labels;

		return await this.allLabelsExist(prLabels);
	}

	/**
	 * Checks if the given {@link labels} exist in a repository owned by the given {@link ownerName} and in a repository
	 * with a name that matches the given {@link repoName}.
	 * @param ownerName The owner of the repository.
	 * @param repoName The name of the repository.
	 * @param labels The list of labels to check for.
	 * @returns A tuple containing a boolean indicating if all the labels exist and a list of invalid labels.
	 */
	private async allLabelsExist(labels: string[]): Promise<[boolean, string[]]> {
		if (labels.length <= 0) {
			return [true, []];
		}

		const repoLabels = await this.labelClient.getAllLabels();

		const invalidLabels = labels.filter((ignoreLabel) => {
			return !repoLabels.some((label) => label.name === ignoreLabel);
		});

		return [!(invalidLabels.length > 0), invalidLabels];
	}

	private async projectExists(orgProject: string): Promise<boolean> {
		ConsoleLogColor.gray(`   ⏳Validating project '${orgProject}'.`);

		return (await this.projectClient.getOrgProjects()).find((p) => p.title === orgProject) !== undefined;
	}

	private async milestoneExists(chosenVersion: string): Promise<boolean> {
		const title = chosenVersion.startsWith("v") ? chosenVersion : `v${chosenVersion}`;

		ConsoleLogColor.gray(`   ⏳Validating milestone '${title}'.`);

		return await this.milestoneClient.milestoneExists(title);
	}

	/**
	 * Validates that the PR template file exists.
	 * @param chosenEnv The type of environment.  Either 'preview' or 'production'.
	 */
	private validatePrTemplate(releaseType: ReleaseType): void {
		ConsoleLogColor.gray("   ⏳Creating pr.");

		const templateDoesNotExist = !existsSync(releaseType.releasePrTemplateFilePath, { isFile: true });

		if (templateDoesNotExist) {
			const errorMsg = `The pr template file '${releaseType.releasePrTemplateFilePath}' does not exist.` +
				`\nCreate a template file in the working directory.`;
			ConsoleLogColor.red(errorMsg);
			Deno.exit(0);
		}
	}

	private async createPullRequest(releaseType: ReleaseType, chosenVersion: string): Promise<number> {
		ConsoleLogColor.gray("   ⏳Creating pr.");

		// Trim the template file path and replace all '\' with '/'
		let templateFilePath = releaseType.releasePrTemplateFilePath.trim()
			.replace(/\\/g, "/");

		templateFilePath = templateFilePath.endsWith("/") ? templateFilePath.slice(0, -1) : templateFilePath;

		const templateDoesNotExist = !(existsSync(templateFilePath, { isFile: true }));

		if (templateDoesNotExist) {
			const errorMsg = `The release notes template file '${templateFilePath}' does not exist.`;
			ConsoleLogColor.red(`${errorMsg}`);
			Deno.exit(1);
		}

		const prTemplate = Deno.readTextFileSync(templateFilePath);
		const title = releaseType.prTitle.replace("${VERSION}", chosenVersion);

		// Create a release pr
		const newPr = await this.prClient.createPullRequest(
			title,
			releaseType.headBranch,
			releaseType.baseBranch,
			prTemplate,
		);

		return newPr.number;
	}

	private async setAssignee(prNumber: number, assignee: string): Promise<void> {
		const prData: IssueOrPRRequestData = {
			assignees: [assignee],
		};

		ConsoleLogColor.gray(`   ⏳Setting pr assignee.`);

		await this.prClient.updatePullRequest(prNumber, prData);
	}

	private async setLabels(prNumber: number, labels: string[]): Promise<void> {
		const prData: IssueOrPRRequestData = {
			labels: labels,
		};

		ConsoleLogColor.gray(`   ⏳Setting pr labels.`);

		await this.prClient.updatePullRequest(prNumber, prData);
	}

	private async getProject(): Promise<string> {
		const orgProjects = (await this.projectClient.getOrgProjects()).map((proj) => proj.title);

		const orgProject = await Select.prompt({
			message: "Choose a GitHub organization project",
			options: orgProjects,
			validate: (value) => {
				if (value.length <= 0) {
					ConsoleLogColor.red("The project name cannot be empty.");
					return false;
				}

				return true;
			},
		});

		return orgProject;
	}

	private async assignToProject(prNumber: number, project: string): Promise<void> {
		ConsoleLogColor.gray(`   ⏳Assigning pr to project '${project}'.`);

		await this.projectClient.addPullRequestToProject(prNumber, project);
	}
}
