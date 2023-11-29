import { assertEquals } from "../deps.ts";
import { Utils } from "../src/core/Utils.ts";

Deno.test("clamp |> when-num-is-larger-than-max |> returns-max-value", () => {
	// Arrange
	const expected = 5;
	const testNumber = 10;

	// Act
	const actual = Utils.clamp(testNumber, 0, 5);

	// Assert
	assertEquals(actual, expected);
});
