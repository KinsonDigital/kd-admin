import { CLI } from "../../../src/core/CLI.ts";

interface Dictionary {
	[key: string]: string;
}

// Create an object whose property name is the same as the type name
// and whose value is the type name.
const compileTargetMonikers: Dictionary = {};
compileTargetMonikers["win-x64"] = "x86_64-pc-windows-msvc";
compileTargetMonikers["linux-x64"] = "x86_64-unknown-linux-gnu";
compileTargetMonikers["mac-x64"] = "x86_64-apple-darwin";
compileTargetMonikers["mac-arm"] = "aarch64-apple-darwin";

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
const compileTargetAsync = async (compileTarget: string): Promise<string> => {
	const denoCompileTarget = compileTargetMonikers[compileTarget]
	const fileExtension = compileTarget === "win-x64" ? ".exe" : "";
	const fileName = `kdcli-${compileTarget}${fileExtension}`;
	const cwd = Deno.cwd();
	let command = `deno compile --target ${denoCompileTarget} --output '${cwd}/${outputDir}/${fileName}' '${cwd}/src/main.ts'`;

	console.log(`Compiling with the deno command:\n\t${command}`);
	const commandResult = await cli.runAsync(command);

	if (commandResult instanceof Error) {
		return `There was an issue compiling for the target '${compileTarget}'.\n${commandResult.message}`;
	}

	return commandResult;
}

const compileTargets = targetMoniker === "all"
	? Object.keys(compileTargetMonikers)
	: [targetMoniker]

const compilers: Promise<string>[] = [];

compileTargets.forEach(targetMoniker => {
	compilers.push(compileTargetAsync(targetMoniker));
});

const compileResults = await Promise.all(compilers);

compileResults.forEach(compileResult => {
	console.log(compileResult);
});
