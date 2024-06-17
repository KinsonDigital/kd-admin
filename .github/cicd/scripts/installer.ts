import { Select, TagClient } from "../../../deps.ts";
import { AppInstaller } from "../core/AppInstaller.ts";

// TODO: Bring in chalk to improve console output
// TODO: Ask the user using cliffy which version to install

const isInteractive = Deno.args.length <= 0;

let version = "";

if (isInteractive) {
	const client = new TagClient("KinsonDigital", "kd-cli");
	const versions = ["latest"];
	versions.push(...(await client.getAllTags()).map((t) => t.name));
	
	version = await Select.prompt({
		message: "Please choose a version to install",
		options: versions,
		transform: (v) => v.toLowerCase().trim(),
	});

	console.log(); // new line
} else {
	version = Deno.args[0].toLowerCase().trim();
}

const appInstaller = new AppInstaller();
await appInstaller.install(version);
