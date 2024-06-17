import { walkSync } from "../../../deps.ts";
import { Utils } from "../../../src/core/Utils.ts";

if (Deno.args.length != 2) {
	let errorMsg = `The required number of arguments is 2 but received ${Deno.args.length}.`;
	errorMsg += `\nPlease provide the following arguments: version type, version.`;
	Utils.printError(errorMsg);
	Deno.exit(100);
}

const versionType = Deno.args[0].trim().toLowerCase();
let version = Deno.args[1].trim().toLowerCase();

if (versionType != "production" && versionType != "preview") {
	Utils.printError(`The version type must be either 'preview' or 'release' but received '${versionType}'.`);
	Deno.exit(200);
}

version = version.startsWith("v") ? version : `v${version}`;

let releaseNotesDirName = "";

if (versionType === "preview") {
	if (Utils.isNotValidPreviewVersion(version)) {
		Utils.printError(`The preview version '${version}' is not valid.`);
		Deno.exit(300);
	}

	releaseNotesDirName = "PreviewReleases";
} else if (versionType === "production") {
	if (Utils.isNotValidProdVersion(version)) {
		Utils.printError(`The production version '${version}' is not valid.`);
		Deno.exit(400);
	}

	releaseNotesDirName = "ProductionReleases";
}

const searchDir = Deno.cwd().trim();

console.log(`Search Directory: ${searchDir}`);

const releaseNotesFileName = `Release-Notes-${version}.md`;

const entries = walkSync(searchDir, {
	includeFiles: true,
	includeDirs: false,
	exts: [".md"],
	match: [new RegExp(`.*${releaseNotesFileName}.*`, "gm")]
});

const configFiles = [...entries]
	.filter((entry) => {
		return entry.path.includes("ReleaseNotes") && entry.path.includes(releaseNotesDirName);
	})
	.map((entry) => entry);

if (configFiles.length === 0) {
	const errorMsg = `The release notes '${releaseNotesFileName}' file could not be found.`;
	Utils.printNotice(errorMsg);
	Deno.exit(1);
}
