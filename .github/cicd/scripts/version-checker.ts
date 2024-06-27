import { RepoClient, TagClient, UsersClient } from "../../../deps.ts";
import { Utils } from "../../../src/core/Utils.ts";

const ownerName = (Deno.env.get("OWNER_NAME") ?? "").trim();

if (ownerName === "") {
	const errorMsg = `The 'OWNER_NAME' environment variable is required.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

const repoName = (Deno.env.get("REPO_NAME") ?? "").trim();

if (repoName === "") {
	const errorMsg = `The 'REPO_NAME' environment variable is required.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

const versionType = (Deno.env.get("VERSION_TYPE") ?? "").trim().toLowerCase();

if (versionType === "") {
	const errorMsg = `The 'VERSION_TYPE' environment variable is required.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

let version = (Deno.env.get("VERSION") ?? "").trim().toLowerCase();

if (version === "") {
	const errorMsg = `The 'VERSION' environment variable is required.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

version = version.startsWith("v") ? version : `v${version}`;

const token = (Deno.env.get("GITHUB_TOKEN") ?? "").trim();

const userCLient: UsersClient = new UsersClient(ownerName, repoName, token);

if (!await userCLient.userExists(ownerName)) {
	const errorMsg = `The user '${ownerName}' does not exist.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

const repoClient: RepoClient = new RepoClient(ownerName, repoName, token);

if (!await repoClient.exists()) {
	const errorMsg = `The repository '${repoName}' does not exist.`;
	Utils.printGitHubError(errorMsg);
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

const tagClient: TagClient = new TagClient(ownerName, repoName, token);

if (await tagClient.tagExists(version)) {
	const errorMsg = `The tag '${version}' already exists.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

if (versionType != "preview" && versionType != "production") {
	const errorMsg = `The version type '${versionType}' is not valid. Valid values are 'preview' or 'production' version type.`;
	Utils.printGitHubError(errorMsg);
	Deno.exit(1);
}

// Verify that the version is a valid preview or production version
if (versionType === "preview") {
	if (Utils.isNotValidPreviewVersion(version)) {
		const errorMsg = `The version '${version}' is not valid. Please provide a valid preview version.`;
		Utils.printGitHubError(errorMsg);
		Deno.exit(1);
	}
} else if (versionType === "production") {
	if (Utils.isNotValidProdVersion(version)) {
		const errorMsg = `The version '${version}' is not valid. Please provide a valid production version.`;
		Utils.printGitHubError(errorMsg);
		Deno.exit(1);
	}
}
