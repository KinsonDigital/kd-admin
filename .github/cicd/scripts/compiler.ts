import { compress, existsSync } from "../../../deps.ts";
import { CLI } from "../../../src/core/CLI.ts";
import { ActualTarget } from "../core/types.ts";

interface Dictionary {
	[key: string]: ActualTarget;
}

// Create an object whose property name is the same as the type name
// and whose value is the type name.
const compileTargetMonikers: Dictionary = {};
compileTargetMonikers["win-x64"] = "x86_64-pc-windows-msvc";
compileTargetMonikers["linux-x64"] = "x86_64-unknown-linux-gnu";

// NOTE: Disabled for now.  macOS support not needed yet.
// compileTargetMonikers["mac-x64"] = "x86_64-apple-darwin";
// compileTargetMonikers["mac-arm"] = "aarch64-apple-darwin";

const outputDir = "dist";
const compileTargetNames = ["all"];

compileTargetNames.push(...Object.keys(compileTargetMonikers));

if (Deno.args.length <= 0) {
	const errorMsg = `No compile target specified.\nValid compile targets are: ${compileTargetNames}`;
	console.log(errorMsg);
	Deno.exit(100);
}

const targetMoniker = Deno.args[0].toLowerCase().trim();

// If the compile target is not a valid value
if (targetMoniker != "all" && !(targetMoniker in compileTargetMonikers)) {
	const errorMsg = `The compile target '${targetMoniker}' is invalid.` +
	`\nValid compile targets are: ${compileTargetNames.join(", ")}`;
	
	console.log(errorMsg);
	Deno.exit(200);
}

const cli: CLI = new CLI();

// Compile for a single os target.
const compileTargetAsync = async (compileTarget: string): Promise<string | Error> => {
	const denoCompileTarget = compileTargetMonikers[compileTarget]
	const fileExtension = compileTarget === "win-x64" ? ".exe" : "";
	const fileName = `kdcli${fileExtension}`;
	const zipFileName = `kdcli-${compileTarget}.zip`;
	const cwd = Deno.cwd();

	const outputFileName = `${cwd}/${outputDir}/${fileName}`;

	let command = `deno compile -A --target ${denoCompileTarget} --output '${outputFileName}' '${cwd}/src/main.ts'`;

	console.log(`Compiling with the deno command:\n\t${command}`);
	const commandResult = await cli.runAsync(command);

	if (commandResult instanceof Error) {
		return new Error(`There was an issue compiling for the target '${compileTarget}'.\n${commandResult.message}`);
	}

	// Make sure that the file exists
	if (!existsSync(outputFileName)) {
		return new Error(`The compiled file '${outputFileName}' does not exist.`);
	}

	const zipOutputFileName = `${cwd}/${outputDir}/${zipFileName}`;

	// Zip the file
	const success = await compress(outputFileName, zipOutputFileName);

	if (!success) {
		throw new Error(`There was an issue zipping the file '${outputFileName}'.`);
	}

	// Delete the original file
	Deno.removeSync(outputFileName);

	return `${commandResult}\nSuccessfully compiled for the target '${compileTarget}'.`;
}

const compileTargets = targetMoniker === "all"
	? Object.keys(compileTargetMonikers)
	: [targetMoniker]

const compilers: Promise<string | Error>[] = [];

compileTargets.forEach(targetMoniker => {
	compilers.push(compileTargetAsync(targetMoniker));
});

const compileResults = await Promise.all(compilers);

compileResults.forEach(compileResult => {
	const compileMsg = compileResult instanceof Error
		? compileResult.message
		: compileResult;

	console.log(compileMsg);
});
