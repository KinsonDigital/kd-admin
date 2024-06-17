import { toText } from "../../deps.ts";

/**
 * Executes an application using the given {@link app} name and {@link args}.
 * @param app The name of the application to run.
 * @param args The arguments to send to the application.
 * @returns A promise that resolves to a string or error.
 */
export default async function runAsync(app: string, args: string[]): Promise<string | Error> {
	if (app === undefined || app === null || app === "") {
		const errorMsg = "The command parameter cannot be null or empty.";
		console.log(errorMsg);
		Deno.exit(1);
	}

 	const cmd = new Deno.Command(app, { args: args, stdout: "piped", stderr: "piped" });

	const child = cmd.spawn();

	const successMsg = await toText(child.stdout);
	const errorMsg = await toText(child.stderr);
	const status = await child.status;

	if (status.success) {
		return successMsg;
	} else {
		return new Error(errorMsg);
	}
};
