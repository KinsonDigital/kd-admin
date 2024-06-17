import { Command } from "../deps.ts";
import { PrCreator } from "./pr-creator.ts";

await new Command()
	.name("hello")
	.description("A simple reverse proxy example cli.")
	.version("v1.0.0")
	.option("--create-pr", "Create a pull request.")
	.command("create-pr")
	.action(async () => {
		const prCreator = new PrCreator();
		await prCreator.createPr();
	})
	.command("prepare-for-release")
	.action(() => {
		
	})
	.parse();
