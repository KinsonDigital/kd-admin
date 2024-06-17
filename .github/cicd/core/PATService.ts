import { EnvVarService } from "./EnvVarService.ts";
import { TokenEnvVarName } from "./types.ts";

export class PATService {
	private readonly envVarService: EnvVarService;
	private readonly KDCLI_TOKEN: TokenEnvVarName = "KDCLI_TOKEN";

	/**
	 * Creates a new instance of the {@link PATService} class.
	 */
	constructor() {
		this.envVarService = new EnvVarService();
	}

	public patExists(): boolean {
		const result = this.envVarService.varExists(this.KDCLI_TOKEN);

		return result;
	}

	public setPAT(pat: string): void {
		this.envVarService.setVar(this.KDCLI_TOKEN, pat);
	}
}
