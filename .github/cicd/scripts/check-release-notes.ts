import { walkSync } from "../../../deps.ts";
import { Utils } from "../../../src/core/Utils.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const versionType = (Deno.env.get("RELEASE_TYPE") ?? "").trim().toLowerCase();

if (versionType === "") {
	Utils.printError(`The 'RELEASE_TYPE' environment variable is require.\n\tFileName: ${scriptFileName}`);
	Deno.exit(1);
}

let version = (Deno.env.get("VERSION") ?? "").trim().toLowerCase();

if (version === "") {
	Utils.printError(`The 'VERSION' environment variable is require.\n\tFileName: ${scriptFileName}`);
	Deno.exit(2);
}

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

	releaseNotesDirName = "preview-releases";
} else if (versionType === "production") {
	if (Utils.isNotValidProdVersion(version)) {
		Utils.printError(`The production version '${version}' is not valid.`);
		Deno.exit(400);
	}

	releaseNotesDirName = "production-releases";
}

const searchDir = Deno.cwd().trim();

console.log(`Search Directory: ${searchDir}`);

const releaseNotesFileName = `${version}.md`;

const entries = walkSync(searchDir, {
	includeFiles: true,
	includeDirs: false,
	exts: [".md"],
	match: [new RegExp(`.*${releaseNotesFileName}.*`, "gm")]
});

const configFiles = [...entries]
	.filter((entry) => {
		return entry.path.includes("release-notes") && entry.path.includes(releaseNotesDirName);
	})
	.map((entry) => entry);

if (configFiles.length === 0) {
	const errorMsg = `The release notes '${releaseNotesFileName}' file could not be found.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}
