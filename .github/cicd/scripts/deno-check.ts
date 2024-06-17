import { walkSync } from "https://deno.land/std@0.216.0/fs/walk.ts";
import { crayon } from "https://deno.land/x/crayon@3.3.3/mod.ts";
import { Guards } from "../../../src/core/guards.ts";
import { CheckOptions } from "./check-options.ts";
import { CheckResult } from "./check-result.ts";
import { toText } from "https://deno.land/std@0.224.0/streams/to_text.ts";

/**
 * Checks a file using deno check.
 * @param file The file to check.
 * @param noNpm Whether to resolve npm modules.
 * @param noNpm Disable auto discovery of the lock file.
 * @returns A promise that resolves to a CheckResult.
 */
export async function checkFile(file: string, noNpm?: boolean, noLock?: boolean): Promise<CheckResult> {
	Guards.isNothing(file);

	const checkResult: CheckResult = {
		file: file,
		result: "",
		hasPassed: true, // Default to passed
	};

	checkResult.result += `Checking ${file}`;

	const args = ["check"];

	if (noNpm === true) {
		args.push("--no-npm");
	}

	if (noLock === false) {
		args.push("--lock");
		args.push("deno.lock");
	}

	args.push(file);

	const denoCheckCmd = new Deno.Command("deno", { args: args, stdout: "piped", stderr: "piped" });

	const subProcess = denoCheckCmd.spawn();

	const successMsg = await toText(subProcess.stdout);
	const errorMsg = await toText(subProcess.stderr);
	const status = await subProcess.status;

	if (status.success) {
		checkResult.result += crayon.lightBlack(successMsg);
		checkResult.result += crayon.lightBlack("✅\n");
	} else {
		checkResult.result += crayon.lightBlack("❌\n");
		checkResult.result += crayon.lightBlack(`   ${errorMsg}`);
		checkResult.hasPassed = false;
	}

	return checkResult;
}

/**
 * Performs a deno check against all of the given {@link files}.
 * @param files All of the files to run deno check against.
 * @param options The options to use when checking the file.
 * @returns A promise that resolves to an array of {@link CheckResult}'s that contain the result for each file.
 */
export async function checkFiles(files: string[], options?: CheckOptions): Promise<CheckResult[]> {
	Guards.isNothing(files);

	const filesToCheck: Promise<CheckResult>[] = [];

	// Perform a deno check on all of the files
	for await (const file of files) {
		filesToCheck.push(checkFile(file, options?.noNpm, options?.noLock));
	}

	// Wait for all of the checks to complete
	const allCheckResults = await Promise.all(filesToCheck);
	
	// Print all of the results
	allCheckResults.forEach((checkResult) => {
		Deno.stdout.writeSync(new TextEncoder().encode(crayon.lightBlack(checkResult.result)));
	});
	
	// Collect the total number of passed and failed checks
	const totalPassed = allCheckResults.filter((r) => r.hasPassed).length;
	const totalFailed = allCheckResults.filter((r) => !r.hasPassed).length;
	
	const resultsMsg = new TextEncoder().encode(crayon.cyan(`\nTotal Passed(✅): ${totalPassed}\nTotal Failed(❌): ${totalFailed}\n`));
	Deno.stdout.writeSync(resultsMsg);
	
	return allCheckResults;
}

/**
 * Checks all of the files in the given {@link directory} including all of it's subdirectories.
 * @param directory The directory and its subdirectories to check.
 * @param options The options to use when checking the file.
 * @returns A promise that resolves to an array of {@link CheckResult}'s that contain the result for each file.
 */
export async function checkAll(directory: string, options?: CheckOptions): Promise<CheckResult[]> {
	Guards.isNothing(directory);

	const files = [...walkSync(directory, {
		includeDirs: false,
		exts: [".ts", ".tsx"],
		skip: options?.skip,
	})].map((entry) => entry.path);

	return await checkFiles(files);
}
