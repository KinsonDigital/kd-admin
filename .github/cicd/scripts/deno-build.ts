#!/usr/bin/env -S deno run --allow-read --allow-run

import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { Guards } from "../../../src/core/guards.ts";
import { DenoBuildSettings } from "./deno-build-settings.ts";
import { checkAll } from "./deno-check.ts";
import { crayon } from "https://deno.land/x/crayon@3.3.3/mod.ts";

let arg = (Deno.args[0] ?? "").trim();

let settingsFilePath = arg === "" ? "./deno-build-settings.json" : arg;
settingsFilePath = settingsFilePath.replace(/\\/gm, "/");


/**
 * Gets the settings if a 'prepare-release-settings.json' file exists in the current working directory.
 * @returns The settings.
 */
const getSettings = (settingsFilePath: string): DenoBuildSettings | undefined=> {
	if (!existsSync(settingsFilePath, { isFile: true })) {
		return undefined;
	}

	const settingJsonData = Deno.readTextFileSync(settingsFilePath);

	const settings = JSON.parse(settingJsonData);

	return validSettingsObj(settings) ? settings : undefined;
}

const validSettingsObj = (settingsObj: unknown): settingsObj is DenoBuildSettings => {
	if (settingsObj === null || typeof settingsObj === undefined || typeof settingsObj !== "object") {
		return false;
	}

	const propsExists = 'ignoreExpressions' in settingsObj;

	if (propsExists) {
		return Guards.isNotNothing(settingsObj.ignoreExpressions) &&
			Array.isArray(settingsObj.ignoreExpressions) &&
			settingsObj.ignoreExpressions.every((b) => Guards.isString(b));
	}

	return false;
}

const settings = getSettings(settingsFilePath);

const ignores = settings?.ignoreExpressions.map((expression) => new RegExp(expression));

console.log(crayon.cyan(`Checking all files in '${Deno.cwd()}' . . .\n`));

const results = await checkAll(Deno.cwd(), {
	noNpm: false,
	noLock: true,
	skip: ignores,
});

const isFailure = results.some((result) => !result.hasPassed);

if (isFailure) {
	Deno.exit(1);
}
