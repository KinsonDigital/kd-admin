import { walkSync } from "../../../deps.ts";
import { Utils } from "../../../src/core/Utils.ts";

/**
 * Pulls the version from a json file.
 */
export class VersionPuller {
	private readonly denoConfig = "deno.json";

	/**
	 * Pulls the version from a json file.
	 * @param searchDir The directory to search in.
	 * @param fileName The name of the file to pull the version from.
	 * @returns The version number.
	 */
	public getVersion(searchDir: string): string {
		const entries = walkSync(searchDir, {
			includeFiles: true,
			includeDirs: false,
			exts: [".json"],
			match: [/.*deno.json.*/gm]
		});

		const configFiles = [...entries].map((entry) => entry);

		if (configFiles.length === 0) {
			const errorMsg = `::error::No '${this.denoConfig}' files found.`;
			Utils.printNotice(errorMsg);
			Deno.exit(1);
		}

		const fileName = configFiles[0].name;
		const filePath = configFiles[0].path;

		const fileData = Deno.readTextFileSync(filePath);

		try {
			const jsonObj = JSON.parse(fileData);
	
			// If the object contains a property with the name version
			if (jsonObj.version === undefined) {
				const errorMsg = `::error::The file '${fileName}' does not contain a version property.`;
				Utils.printError(errorMsg);
				Deno.exit(1);
			}
	
			return jsonObj.version;
		} catch (error) {
			const errorMsg = `There was a problem parsing the file '${fileName}'.\n${error.message}`;
			console.log(`::error::${errorMsg}`);
			Deno.exit(1);
		}
	}
}
