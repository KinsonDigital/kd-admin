import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { walkSync } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { TagClient } from "https://deno.land/x/kd_clients@v1.0.0-preview.13/GitHubClients/TagClient.ts";

const baseDirPath = "./dev-tools/bin";
const filesToUpdate = [...walkSync(baseDirPath, { includeFiles: true, match: [/kd-admin/]})].map((f) => f.path);

const tagClient = new TagClient("KinsonDigital", "kd-admin");
const tags: string[] = (await tagClient.getAllTags()).map((t) => t.name);
const latestVersion = tags[0];

filesToUpdate.forEach(async file => {
	await updateFile(file);
});

console.log(`%ckd-admin has been updated to version '${latestVersion}'.`, "color: green");

async function updateFile (filePath: string) {
	const isInstalled = existsSync(filePath, { isFile: true });

	if (!isInstalled) {
		console.log("%ckd-admin is not installed in this directory.", "color: red");
		Deno.exit(0);
	}

	const fileContent = Deno.readTextFileSync(filePath);
	const fileLines = fileContent.split("\n");

	const urlLine = fileLines.find((line) => line.includes("deno") && line.includes("https://"));

	const corruptErrorMsg  = `%cThe file '${filePath}' is corrupted. Please reinstall the script.`;

	if (urlLine === undefined) {
		console.log(corruptErrorMsg, "color: red");
		Deno.exit(1);
	}

	const sections = urlLine.split(" ");

	const url = sections.find((section) => section.includes("https://")) ?? "";

	if (url === "") {
		console.log(corruptErrorMsg, "color: red");
		Deno.exit(1);
	}

	const versionRegex = /v([1-9]\d*|0)\.([1-9]\d*|0)\.([1-9]\d*|0)(-preview\.([1-9]\d*))?/gm;

	const regexResult = versionRegex.exec(url);
	const currentVersion = regexResult?.[0] ?? "";

	if (currentVersion === "") {
		console.log(corruptErrorMsg, "color: red");
		Deno.exit(1);
	}

	if (currentVersion === latestVersion) {
		console.log("%ckd-admin is up to date.", "color: green");
		Deno.exit(0);
	}

	const newUrl = url.replace(versionRegex, latestVersion);

	// Find the url in the sections array and replace it with the new url
	const newSections = sections.map((section) => {
		if (section.includes("https://")) {
			return newUrl;
		}

		return section;
	});


	const newUrlLine = newSections.join(" ");

	const newFileLines = fileLines.map((line) =>  {
		if (line.includes("deno") && line.includes("https://")) {
			return newUrlLine;
		}

		return line;
	});

	const newFileContent = newFileLines.join("\n");

	Deno.writeTextFileSync(filePath, newFileContent);
};
