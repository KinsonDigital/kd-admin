import { ParamGuards } from "./core/param-guards.ts";
import { existsSync } from "../deps.ts";
import { PrepareReleaseSettings } from "./prepare-release-settings.ts";

/**
 * Updates versions in csharp project files.
 */
export class CSharpVersionUpdater {
	/**
	 * Updates the version in the csharp project file at the given {@link versionFilePath}.
	 * @param settings The prepare release settings.
	 * @param newVersion The new version.
	 * @throws {Error} Thrown for the following reasons:
	 * 1. If the csproj file does not exist.
	 * 2. If the csproj file does not contain a version XML element.
	 * 3. If the csproj file does not contain a file version XML element.
	 */
	public updateVersion(settings: PrepareReleaseSettings, newVersion: string) {
		ParamGuards.isNothing(newVersion, "newVersion null, empty, or undefined.");

		const versionFilePath = settings.versionFilePath ?? "";

		if (!existsSync(versionFilePath, { isFile: true })) {
			throw new Error(`The version file path '${versionFilePath}' does not exist.`);
		}

		let versionFileContent = Deno.readTextFileSync(versionFilePath);

		const versionTagRegex = /<Version\s*>.*<\/Version\s*>/gm;
		const fileVersionTagRegex = /<FileVersion\s*>.*<\/FileVersion\s*>/gm;

		const versionTagExists = versionTagRegex.test(versionFileContent);

		if (!versionTagExists) {
			const errorMsg = `The csharp project file does not contain a version property.` +
				`\nExpected '<Version>...</Version>'`;
			throw new Error(errorMsg);
		}

		const fileVersionTagExists = fileVersionTagRegex.test(versionFileContent);

		if (!fileVersionTagExists) {
			const errorMsg = `The csharp project file does not contain a file version property.` +
				`\nExpected '<FileVersion>...</FileVersion>'`;
			throw new Error(errorMsg);
		}

		// Update the version files
		versionFileContent = versionFileContent.replace(versionTagRegex, `<Version>${newVersion}</Version>`);
		versionFileContent = versionFileContent.replace(fileVersionTagRegex, `<FileVersion>${newVersion}</FileVersion>`);

		Deno.writeTextFileSync(versionFilePath, versionFileContent);
	}
}
