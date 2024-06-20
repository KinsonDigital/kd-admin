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
	public updateVersion(settings: PrepareReleaseSettings, newVersion: string) {
		ParamGuards.isNothing(newVersion, "newVersion null, empty, or undefined.");

		const versionFilePath = settings.versionFilePath ?? "";

		if (!existsSync(versionFilePath, { isFile: true })) {
			throw new Error(`The version file path does not exist: ${versionFilePath}`);
		}

		const versionFileContent = Deno.readTextFileSync(versionFilePath);
		const versionConfig = JSON.parse(versionFileContent);

		const propChain = settings.versionJSONKeyPath?.split(".").map((i) => i.trim()) ?? ["version"];

		const result = this.setPropertyValue(versionConfig, propChain, newVersion);

		if (result[0] === false) {
			console.log(`%c${result[1]}`, "color: red;");
			Deno.exit(1);
		}

		Deno.writeTextFileSync(versionFilePath, `${JSON.stringify(versionConfig, null, 4)}\n`);
	}

	/**
	 * Sets a property in the given {@link propChain} to the given {@link newValue}.
	 * @param obj The object that might contains the property to update.
	 * @param propChain The property chain path to the property to update.
	 * @param newValue The new value to set the last prop in the chain to.
	 * @returns A tuple where the first item is a boolean indicating if the property was set and the second item is an error message if the property was not set.
	 */
	private setPropertyValue(obj: any, propChain: string[], newValue: string | number): [boolean, string | undefined] {
		if (propChain.length === 0) {
			return [false, ""];
		}
	
		let currentObj = obj;
	
		for (let i = 0; i < propChain.length - 1; i++) {
			const propertyName = propChain[i];
	
			if (!(propertyName in currentObj)) {
				return [false, `The property '${propertyName}' does not exist.`];
			}
	
			if (currentObj !== null && typeof currentObj === 'object') {
				currentObj = currentObj[propertyName];
			} else {
				return [false, "Cannot set a value on a non-object"];
			}
		}
	
		const lastPropName = propChain[propChain.length - 1];
	
		if (!(lastPropName in currentObj)) {
			return [false, `The property '${lastPropName}' does not exist.`];
		}
	
		currentObj[lastPropName] = newValue;
	
		return [true, undefined];
	}
}
