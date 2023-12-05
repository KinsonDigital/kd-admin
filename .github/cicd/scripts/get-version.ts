import { Utils } from "../../../src/core/Utils.ts";
import { VersionPuller } from "../core/VersionPuller.ts";

const versionPuller: VersionPuller = new VersionPuller();

const version = versionPuller.getVersion(Deno.cwd());

const outputFilePath = Deno.env.get("GITHUB_OUTPUT") ?? "";

if (outputFilePath === "") {
	const errorMsg = `The environment variable 'GITHUB_OUTPUT' does not exist.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}

Deno.writeTextFileSync(outputFilePath, `version=${version}`);

console.log(`The step output 'version' has been set to '${version}' in GitHub output file '${outputFilePath}'.`);
