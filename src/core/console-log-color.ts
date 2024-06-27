/**
 * Provides a simple way to log colored messages to the console.
 */
export class ConsoleLogColor {
	/**
	 * Logs the given {@link msg} to the console in red text.
	 * @param msg The message to log.
	 */
	public static red(msg: string): void {
		console.log(`%c${msg}`, "color: red;");
	}

	/**
	 * Logs the given {@link msg} to the console in green text.
	 * @param msg The message to log.
	 */
	public static green(msg: string): void {
		console.log(`%c${msg}`, "color: green;");
	}

	/**
	 * Logs the given {@link msg} to the console in blue text.
	 * @param msg The message to log.
	 */
	public static blue(msg: string): void {
		console.log(`%c${msg}`, "color: blue;");
	}

	/**
	 * Logs the given {@link msg} to the console in yellow text.
	 * @param msg The message to log.
	 */
	public static yellow(msg: string): void {
		console.log(`%c${msg}`, "color: yellow;");
	}

	/**
	 * Logs the given {@link msg} to the console in cyan text.
	 * @param msg The message to log.
	 */
	public static cyan(msg: string): void {
		console.log(`%c${msg}`, "color: cyan;");
	}

	/**
	 * Logs the given {@link msg} to the console in gray text.
	 * @param msg The message to log.
	 */
	public static gray(msg: string): void {
		console.log(`%c${msg}`, "color: gray;");
	}
}
