import { Guards } from "./guards.ts";

export class ParamGuards {
	/**
	 * Throws an error if the given {@link value} is undefined.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is undefined.
	 */
	public static isUndefined(value: unknown, errorMsg?: string): void {
		if (Guards.isUndefined(value)) {
			const msg = errorMsg === undefined ? "The value is undefined." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is not undefined.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is not undefined.
	 */
	public static isNotUndefined(value: unknown, errorMsg?: string): void {
		if (Guards.isNotUndefined(value)) {
			const msg = errorMsg === undefined ? "The value is not undefined." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is null.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is null.
	 */
	public static isNull(value: unknown, errorMsg?: string): void {
		if (Guards.isNull(value)) {
			const msg = errorMsg === undefined ? "The value is null." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is not null.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is not null.
	 */
	public static isNotNull(value: unknown, errorMsg?: string): void {
		if (Guards.isNotNull(value)) {
			const msg = errorMsg === undefined ? "The value is not null." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is a string.
	 * @param value The value to check.
	 * @param errorMsg The error message to throw if the value is a string.
	 * @throws {Error} If the {@link value} is a string.
	 */
	public static isString(value: unknown, errorMsg?: string): void {
		if (Guards.isString(value)) {
			const msg = errorMsg === undefined ? "The value is a string." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is not a string.
	 * @param value The value to check.
	 * @param errorMsg The error message to throw if the value is not a string.
	 * @throws {Error} If the {@link value} is not a string.
	 */
	public static isNotString(value: unknown, errorMsg?: string): void {
		if (Guards.isNotString(value)) {
			const msg = errorMsg === undefined ? "The value is not a string." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is an empty string or array.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is an empty string or array.
	 */
	public static isEmpty<T>(value: string | T[], errorMsg?: string): void {
		if (Guards.isEmpty(value)) {
			const msg = errorMsg === undefined ? "The string is empty." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is not an empty string or array.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is not an empty string or array.
	 */
	public static isNotEmpty<T>(value: string | T[], errorMsg?: string): void {
		if (Guards.isNotEmpty(value)) {
			const msg = errorMsg === undefined ? "The string is not empty." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is a function.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is a function.
	 */
	public static isFunction(value: unknown, errorMsg?: string): void {
		if (Guards.isFunction(value)) {
			const msg = errorMsg === undefined ? "The value is a function." : errorMsg;
			throw new Error(msg);
		}
	}
	
	/**
	 * Throws an error if the given {@link value} is not a function.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is not a function.
	 */
	public static isNotFunction(value: unknown, errorMsg?: string): void {
		if (Guards.isNotFunction(value)) {
			const msg = errorMsg === undefined ? "The value is not a function." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is undefined or null.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is undefined or null.
	 */
	public static isUndefinedOrNull(value: unknown, errorMsg?: string): void {
		if (Guards.isUndefinedOrNull(value)) {
			const msg = errorMsg === undefined ? "The value is undefined or null." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is undefined, null, or empty.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is undefined, null, or empty.
	 */
	public static isUndefinedOrNullOrEmpty(value: unknown, errorMsg?: string): void {
		if (Guards.isUndefinedOrNullOrEmpty(value)) {
			const msg = errorMsg === undefined ? "The value is undefined, null, or empty." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is nothing.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is nothing.
	 */
	public static isNothing(value: unknown, errorMsg?: string): void {
		if (Guards.isNothing(value)) {
			const msg = errorMsg === undefined ? "The value is nothing." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is not nothing.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is not nothing.
	 */
	public static isNotNothing(value: unknown, errorMsg?: string): void {
		if (!Guards.isNothing(value)) {
			const msg = errorMsg === undefined ? "The value is not nothing." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is an error.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is an error.
	 */
	public static isError(value: unknown, errorMsg?: string): void {
		if (Guards.isError(value)) {
			const msg = errorMsg === undefined ? "The value is an error." : errorMsg;
			throw new Error(msg);
		}
	}

	/**
	 * Throws an error if the given {@link value} is not an error.
	 * @param value The value to check.
	 * @throws {Error} If the {@link value} is not an error.
	 */
	public static isNotError(value: unknown, errorMsg?: string): void {
		if (Guards.isNotError(value)) {
			const msg = errorMsg === undefined ? "The value is not an error." : errorMsg;
			throw new Error(msg);
		}
	}
}
