import { existsSync } from "../deps.ts";
import { ParamGuards } from "./core/param-guards.ts";
import { PrepareReleaseSettings } from "./prepare-release-settings.ts";

/**
 * Updates the version in a JSON file.
 */
export class JsonVersionUpdater {
	/**
	 * Updates the version in the JSON version file at the given {@link versionFilePath}.
	 * @param settings The prepare release settings.
	 * @param newVersion The new version.
	 * @throws {Error} Thrown if the version file does not exist or the version file does not contain a 'version' property.
	 */
	public updateVersion(settings: PrepareReleaseSettings, newVersion: string): void {
		ParamGuards.isNothing(newVersion, "newVersion null, empty, or undefined.");

		const versionFilePath = settings.versionFilePath ?? "";

		if (!existsSync(versionFilePath, { isFile: true })) {
			throw new Error(`The version file path does not exist: ${versionFilePath}`);
		}

		const versionFileContent = Deno.readTextFileSync(versionFilePath);

		try {
			const versionConfig = JSON.parse(versionFileContent);
			const propChain = settings.versionJSONKeyPath?.split(".").map((i) => i.trim()) ?? ["version"];
			
			const result = this.setPropertyValue(versionConfig, propChain, newVersion);
			
			if (result[0] === false) {
				console.log(`%c${result[1]}`, "color: red;");
				Deno.exit(1);
			}
			
			Deno.writeTextFileSync(versionFilePath, `${JSON.stringify(versionConfig, null, 4)}\n`);
		} catch (error) {
			const errorMsg = `There was a problem parsing the file '${versionFilePath}'.\n${error.message}`;
			console.log(`%c${errorMsg}`, "color: red;");
			Deno.exit(1);
		}
	}

	/**
	 * Sets a property in the given {@link propChain} to the given {@link newValue}.
	 * @param obj The object that might contains the property to update.
	 * @param propChain The property chain path to the property to update.
	 * @param newValue The new value to set the last prop in the chain to.
	 * @returns A tuple where the first item is a boolean indicating if the property was set and the second item is an error message if the property was not set.
	 */
	private setPropertyValue<T extends { [key: string]: unknown }>(
		obj: T,
		propChain: string[],
		newValue: string | number,
	): [boolean, string | undefined] {
		let currentObj: Record<string, unknown> = obj; // Start with the entire object

		for (let i = 0; i < propChain.length - 1; i++) {
			const propertyName = propChain[i];
			if (!(propertyName in currentObj)) {
				return [false, `The property '${propertyName}' does not exist.`];
			}

			currentObj = currentObj[propertyName] as Record<string, unknown>;
		}

		const finalPropName = propChain[propChain.length - 1];

		if (finalPropName in currentObj) {
			(currentObj as Record<string, unknown>)[finalPropName] = newValue; // Set the new value
			return [true, undefined];
		}

		return [false, `The property '${finalPropName}' does not exist.`];
	}
}
