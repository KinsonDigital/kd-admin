import { Guard } from "core/Guard.ts";
import { DenoPermission, ActualTarget, TargetChoice, LocalUserDataEnvVar, LinuxUsrDirPath } from "./types.ts";
import { CLI } from "core/CLI.ts";
import { Utils } from "core/Utils.ts";
import { Confirm, Input, Secret, TagClient, existsSync, uuid } from "../../../deps.ts";
import { EnvVarService } from "./EnvVarService.ts";
import { PATService } from "./PATService.ts";
import { ProgressBar } from "./ProgressBar.ts";

export class AppInstaller {
	private readonly permissions: DenoPermission[] = ["--allow-read", "--allow-write", "--allow-run", "--allow-sys", "--allow-net"];
	private readonly actualTargets: ActualTarget[] = [
		"x86_64-pc-windows-msvc",
		"x86_64-unknown-linux-gnu",
		"x86_64-apple-darwin",
		"aarch64-apple-darwin"];
	private readonly targetChoices: TargetChoice[] = [
		"win-x64",
		"linux-x64",
		"macos-x64",
		"macos-arm"];
	private readonly targetMap: Record<TargetChoice, ActualTarget> = {
		"win-x64": "x86_64-pc-windows-msvc",
		"linux-x64": "x86_64-unknown-linux-gnu",
		"macos-x64": "x86_64-apple-darwin",
		"macos-arm": "aarch64-apple-darwin",
	};
	private readonly appName = "kdcli";
	private readonly githubOrgName = "KinsonDigital";
	private readonly repoName = "kd-cli";
	private readonly envVarService: EnvVarService;
	private readonly patService: PATService;
	private installProgress: ProgressBar;

	// TODO: Setup all console logs to use chalk
	// TODO: Add console msgs of install process
	// TODO: create path variable for windows


	/**
	 * Creates a new instance of the {@link AppInstaller} class.
	 */
	constructor() {
		this.envVarService = new EnvVarService();
		this.patService = new PATService();
		this.installProgress = new ProgressBar(0, 6);
	}

	public async install(version: string): Promise<void> {
		const funcName = "install";
		Guard.isNothing(version, funcName, "version");

		if (Deno.build.os != "windows" && Deno.build.os != "linux") {
			const errorMsg = `The current operating system '${Deno.build.os}' is not supported.`;
			console.log(errorMsg);
			Deno.exit(1);
		}

		version = version.trim().toLowerCase();
		version = version === "latest" || version.startsWith("v") ? version : `v${version}`;

		if (version != "latest" && Utils.isNotValidPreviewOrProdVersion(version)) {
			console.log(`The version '${version}' is not a valid preview or production version.`);
			Deno.exit();
		}

		// Setup the PAT
		await this.setupPAT();

		const target = Deno.build.os === "windows" ? "win-x64" : "linux-x64";
		const installDirPath = await this.installForTarget(version, target);

		// Clean up all temp directories
		this.installProgress.update("Finishing up.");
		this.cleanTempDirs();

		// Add the app to the path environment variable
		this.setupPathEnvVar(installDirPath);
	}

	private async installForTarget(version: string, target: TargetChoice): Promise<string> {
		const funcName = "installForTarget";
		Guard.isNothing(version, funcName, "version");
		Guard.isNothing(target, funcName, "target");

		const uuid = crypto.randomUUID();

		const appFileName = `${this.appName}${this.getAppExtension()}`;
		const tempDir = `${Deno.cwd()}/install-${uuid}`;
		const compileOutput = `${tempDir}/${appFileName}`;

		this.installProgress.update(`Creating temp directory '${tempDir}'`);
		Deno.mkdirSync(tempDir);

		const chosenTarget = this.targetMap[target];

		const tagClient = new TagClient(this.githubOrgName, this.repoName);

		if (version === "latest") {
			this.installProgress.update("Getting latest version.");
			version = (await tagClient.getAllTags())[0].name;
		} else {
			this.installProgress.update(`Verifying that version ${version} exists.`);
			if (!(await tagClient.tagExists(version))) {
				const errorMsg = `The version '${version}' does not exist.`;
				console.log(errorMsg);
				Deno.exit();
			}
		}		

		const appUrl = `https://raw.githubusercontent.com/${this.githubOrgName}/kd-cli/${version}/src/main.ts`;

		const commandSections = [
			"deno",
			"compile",
			...this.permissions,
			`--output ${compileOutput}`,
			"--target",
			chosenTarget,
			appUrl,
		];

		const commandString = commandSections.join(" ");

		const cli = new CLI();
		
		this.installProgress.update(`Compiling '${this.appName}' application with command ${commandString}`);
		const result = await cli.runAsync(commandString);

		const resultMsg = result instanceof Error ? result.message : result;
		console.log(resultMsg);

		// Get the install directory
		const installDirPath = this.getInstallDirectory();
		const installFilePath = `${installDirPath}/${appFileName}`;

		// Create the install directory if it does not exist
		if (!existsSync(installDirPath)) {
			this.installProgress.update(`Creating install directory '${installDirPath}'`);
			Deno.mkdirSync(installDirPath);
		}

		// Copy the compiled file to the install directory
		this.installProgress.update(`Adding compiled application '${appFileName}' to '${installDirPath}' directory.`);
		Deno.copyFileSync(compileOutput, installFilePath);

		return installDirPath;
	}

	/**
	 * Returns the extension of the executable file based on the operating system.
	 * @returns The extension of the executable file.
	 */
	private getAppExtension(): string {
		return Deno.build.os === "windows" ? ".exe" : "";
	}

	/**
	 * Returns the install directory path based on if the operating system is Windows or Linux.
	 * @returns The install directory path.
	 */
	private getInstallDirectory(): string {
		const localAppDataEnvVar: LocalUserDataEnvVar = "LOCALAPPDATA";

		const baseInstallDirPath: string | LinuxUsrDirPath = Deno.build.os === "windows"
			? Deno.env.get(localAppDataEnvVar) ?? ""
			: "/usr";

		if (Utils.isNothing(baseInstallDirPath)) {
			const errorMsg = `The environment variable '${localAppDataEnvVar}' is not set or does not exist.`;
			console.log(errorMsg);
			Deno.exit(1);
		}

		const result = `${baseInstallDirPath}/kdcli`;

		return result;
	}

	/**
	 * Cleans up any remaining temp directories that were created during installs.
	 */
	private cleanTempDirs(): void {
		const dirEntries = Deno.readDirSync(Deno.cwd())

		const tempDirs = [...dirEntries]
			.filter((dir) => {
				const correctPrefix = dir.name.startsWith("install-");

				if (!correctPrefix) {
					return false;
				}

				const uuidPostfix = dir.name.replaceAll("install-", "");

				return uuid.validate(uuidPostfix);
			})
			.map((dir) => `${Deno.cwd()}/${dir.name}`);

		tempDirs.forEach((dir) => Deno.removeSync(dir, { recursive: true }));
	}

	private setupPathEnvVar(appDirPath: string): void {
		if (Deno.build.os === "windows") {
			this.setupWinPathEnvVar(appDirPath);
		} else {
			const errorMsg = `Path environment variable for The operating system '${Deno.build.os}' is not supported.` +
				"\nNo path environment variable were setup.";
			console.log(errorMsg);
			Deno.exit();
		}
	}

	private setupWinPathEnvVar(appDirPath: string): void {
		appDirPath = appDirPath.replaceAll("/", "\\");
		const PATH = "PATH";

		if (this.envVarService.varExists(PATH)) {
			const pathEnvVar = this.envVarService.getVar(PATH);
			const varPathSet = new Set(pathEnvVar.split(";"));
			varPathSet.add(appDirPath);

			let varPathItems = [...varPathSet];
			varPathItems = varPathItems.map((item) => {
				if (item.toLowerCase().includes(this.appName)) {
					return item.replaceAll("/", "\\");
				}

				return item;
			});

			if (varPathItems.includes(appDirPath)) {
				return;
			}

			const pathEnvVarValue = varPathItems.join(";");

			this.envVarService.setVar(PATH, pathEnvVarValue);
		} else {
			this.envVarService.setVar(PATH, appDirPath);
		}
	}

	private async setupPAT(): Promise<void> {
		if (this.patService.patExists()) {
			return;
		}

		const confirmResult = await Confirm.prompt({
			message: `A GitHub personal access token is required to use the '${this.appName}' application.` +
				" Would you like to create one now?",
			default: false,
		});

		if (confirmResult) {
			console.log(); // new line

			const token = await Secret.prompt({
				message: "Please enter a GitHub personal access token",
				hint: "The token will be hidden from view . . .",
			});

			this.patService.setPAT(token);
		}
	}
}
