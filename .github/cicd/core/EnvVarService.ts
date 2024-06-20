import { CLI } from "../../../src/core/CLI.ts";

export class EnvVarService {
	private readonly cli: CLI;

	/**
	 * Creates a new instance of the {@link EnvVarService} class.
	 */
	constructor() {
		this.cli = new CLI();
	}

	public getVar(varName: string): string {
		if (Deno.build.os === "windows") {
			return this.getVarWin(varName) ?? "";
		} else {
			return this.getVarLinux(varName) ?? "";
		}
	}

	public setVar(varName: string, value: string): void {
		if (Deno.build.os === "windows") {
			this.setVarWin(varName, value);
		} else {
			this.setVarLinux(varName, value);
		}
	}
	
	public varExists(varName: string): boolean {
		if (Deno.build.os === "windows") {
			return !(this.getVarWin(varName) === undefined);
		} else {
			return this.exitWithUnsupportedOsError() as boolean;
		}
	}

	private getVarWin(varName: string): string | undefined {
		return Deno.env.get(varName);
	}
	
	private getVarLinux(varName: string): string | undefined {
		return this.exitWithUnsupportedOsError() as string;
	}

	private async setVarWin(varName: string, value: string): Promise<void> {
		const commandResult = await this.cli.runAsync(`setx ${varName} ${value}`);

		if (commandResult instanceof Error) {
			console.log(commandResult.message);
			Deno.exit(1);
		}
	}

	private async setVarLinux(varName: string, value: string): Promise<void> {
		this.exitWithUnsupportedOsError();
	}

	private exitWithUnsupportedOsError(): void | boolean | string {
		const errorMsg = `Environment variable support for the operating system '${Deno.build.os}' not implemented.`;
		console.log(errorMsg);
		Deno.exit();
	}
}
