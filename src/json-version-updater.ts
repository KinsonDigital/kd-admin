import { existsSync } from "../deps.ts";
import { ParamGuards } from "./core/param-guards.ts";

/**
 * Updates the version in a JSON file.
 */
export class JsonVersionUpdater {
	/**
	 * Updates the version in the JSON version file at the given {@link versionFilePath}.
	 * @param versionFilePath The full or relative file path to the version file.
	 * @param newVersion The new version.
	 * @throws {Error} Thrown if the version file does not exist or the version file does not contain a 'version' property.
	 */
	public updateVersion(versionFilePath: string, newVersion: string) {
		ParamGuards.isNothing(versionFilePath, "versionFilePath null, empty, or undefined.");
		ParamGuards.isNothing(newVersion, "newVersion null, empty, or undefined.");

		if (!existsSync(versionFilePath, { isFile: true })) {
			throw new Error(`The version file path does not exist: ${versionFilePath}`);
		}

		const versionFileContent = Deno.readTextFileSync(versionFilePath);

		const versionConfig: { version: string } = JSON.parse(versionFileContent);

		if (!this.containsVersionProp(versionConfig)) {
			throw new Error(`The version file does not contain a version property: ${versionFilePath}`);
		}

		versionConfig.version = newVersion;

		Deno.writeTextFileSync(versionFilePath, `${JSON.stringify(versionConfig, null, 4)}\n`);
	}

	/**
	 * Validates that the given {@link obj} contains a version property.
	 * @param obj The object to validate.
	 * @returns True if the object contains a version property; otherwise, false.
	 */
	private containsVersionProp(obj: unknown): obj is { version: string } {
		return obj !== null &&
			obj !== undefined &&
			typeof obj === "object" && "version" in obj;
	}
}
