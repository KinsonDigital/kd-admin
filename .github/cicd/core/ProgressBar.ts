import { delay } from "https://deno.land/std@0.208.0/async/delay.ts";
import { Progress } from "../../../deps.ts";
import { Utils } from "core/Utils.ts";

export class ProgressBar {
	private readonly progress: Progress;
	private readonly min: number;
	private readonly max: number;
	private completion: number;

	constructor(min: number, max: number) {
		this.min = min;
		this.max = max;

		this.progress = new Progress({
			total: this.max,
		});

		this.completion = 0;
	}

	public update(msg?: string): void {
		this.progress.render(this.completion++, {
			title: "Installing",
			text: msg,
		});

		delay(2000);
	}	
}
