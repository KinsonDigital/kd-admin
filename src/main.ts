import { Command } from "../deps.ts";
import { PrCreator } from "./pr-creator.ts";
import { ReleasePrepper } from "./release-prepper.ts";

const command = new Command()
	.name("kd-admin")
	.description("Tool to create prs and prepare for releases.")
	.version("v1.0.0-preview.1")
	.command("create-pr")
	.action(async () => {
		const prCreator = new PrCreator();
		await prCreator.createPr();
	})
	.command("prepare-for-release")
	.action(async () => {
		const prepareRelease = new ReleasePrepper();
		await prepareRelease.prepareForRelease();
	});

if (Deno.args.length === 0) {
	command.showHelp();
} else {
	await command.parse(Deno.args);
}
