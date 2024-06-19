import { Confirm } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";
import { TagClient } from "https://deno.land/x/kd_clients@v1.0.0-preview.13/GitHubClients/TagClient.ts";
import runAsync from "../src/core/run-async.ts";
import { CreatePrSettings } from "../src/create-pr-settings.ts";
import { PrepareReleaseSettings } from "../src/prepare-release-settings.ts";
import { existsSync } from "../deps.ts";

const scriptArgs = Deno.args.map((arg) => arg.trim());

let [version] = scriptArgs;
version = version.toLowerCase();
version = version === "latest" || version.startsWith("v") ? version : `v${version}`;

const createPrShellFileName = "create-pr.ps1";
const prepareReleaseShellFileName = "prepare-for-release.ps1";
const createPrSettingsFileName = "create-pr-settings.json";
const prepareReleaseSettingsFileName = "prepare-release-settings.json";

if (existsSync(`./${createPrShellFileName}`)) {
	console.log(`%c'${createPrShellFileName}' file already exists. Skipping creation.`, "color: khaki");
} else {
	const confirmCreatePRShellScript = await Confirm.prompt({
		message: "Do you want to add a powershell script to create a PR?",
		default: true,
	});

	if (!confirmCreatePRShellScript) {
		Deno.writeTextFileSync(`./${createPrShellFileName}`, "& \"bin/kd-admin\" create-pr;");
		console.log(`%cCreated '${createPrShellFileName}' file.`, "color: gray");
	}
}

if (existsSync(`./${prepareReleaseShellFileName}`)) {
	console.log(`%c'${prepareReleaseShellFileName}' file already exists. Skipping creation.`, "color: khaki");
} else {
	const confirmCreatePrepareReleaseShellScript = await Confirm.prompt({
		message: "Do you want to add a powershell script to prepare for a release?",
		default: true,
	});

	if (confirmCreatePrepareReleaseShellScript) {
		Deno.writeTextFileSync(`./${prepareReleaseShellFileName}`, "& \"bin/kd-admin\" prepare-for-release;");
		console.log(`%cCreated '${prepareReleaseShellFileName}' file.`, "color: gray");
	}
}

if (existsSync(`./${createPrSettingsFileName}`)) {
	console.log(`%c'${createPrSettingsFileName}' file already exists. Skipping creation.`, "color: khaki");
} else {
	const confirmCreatePRSettingsFile = await Confirm.prompt({
		message: "Do you want to add a create PR settings file?",
		default: true,
	});

	if (confirmCreatePRSettingsFile) {
		const prSettings: CreatePrSettings = {
			ownerName: "",
			repoName: "",
			githubTokenEnvVarName: "",
			baseBranches: []
		};
		
		Deno.writeTextFileSync(`./${createPrSettingsFileName}`, `${JSON.stringify(prSettings, null, 2)}\n`);
	}
}

if (existsSync(`./${prepareReleaseSettingsFileName}`)) {
	console.log(`%c'${prepareReleaseSettingsFileName}' file already exists. Skipping creation.`, "color: khaki");
} else {
	const confirmCreatePrepareReleaseSettingFiles = await Confirm.prompt({
		message: "Do you want to add a the prepare for release setting files?",
		default: true,
	});
	
	if (confirmCreatePrepareReleaseSettingFiles) {
		const prepareReleaseSettings: PrepareReleaseSettings = {
			ownerName: "",
			repoName: "",
			orgProjectName: "",
			releaseTypes: [
				{
					name: "",
					reviewer: "",
					assignee: "",
					headBranch: "",
					baseBranch: "",
					genReleaseSettingsFilePath: "",
					releaseNotesDirPath: "",
					releasePrTemplateFilePath: "",
					releaseLabels: [],
					prTitle: "",
				},
			],
			githubTokenEnvVarName: "",
			versionFilePath: "",
		};

		Deno.writeTextFileSync(`./${prepareReleaseSettingsFileName}`, `${JSON.stringify(prepareReleaseSettings, null, 2)}\n`);
	}
}

const ownerName = "KinsonDigital";
const repoName = "kd-admin";

const tagClient = new TagClient(ownerName, repoName);

const allTags = (await tagClient.getAllTags()).map((t) => t.name);

if (version === "latest") {
	version = allTags[0];
} else {
	const tagExists = allTags.includes(version);

	if (!tagExists) {
		console.log(`%cThe version '${version}' does not exist. Aborting installation.`, "color: red");
		Deno.exit(1);
	}
}

const args = [
	"install",
	"--allow-env",
	"--allow-read",
	"--allow-write",
	"--allow-net",
	"--reload",
	"--name",
	"kd-admin",
	"--root",
	"./dev-tools",
	"-f",
	`https://raw.githubusercontent.com/${ownerName}/${repoName}/${version}/src/main.ts`,
];

console.log("   %c⏳ Installing kd-admin ...", "color: gray");
await runAsync("deno", args);
console.log("%cInstallation complete!", "color: green");

console.log("%cMake sure to fill out all of the setting files!", "color: khaki");
