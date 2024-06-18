import { assertEquals } from "../deps.ts";
import { Utils } from "core/Utils.ts";


Deno.test("clamp |> when-num-is-larger-than-max |> returns-max-value", () => {
	// Arrange
	const expected = 5;
	const testNumber = 10;

	// Act
	const actual = Utils.clamp(testNumber, 0, 5);

	// Assert
	assertEquals(actual, expected);
});

[
	[undefined, true],
	[null, true],
	["", true],
	["test", false],
	[42, false],
	[[], false],
	[[1, 2, 3], false],
	[() => "test", false],
	[{ name: "John" }, false]
].forEach((testParams) => {
	Deno.test("isNothing |> when invoked |> returns correct result", () => {
		// Arrange
		const [value, expected] = testParams;
		
		// Act
		const result = Utils.isNothing(value);

		// Assert
		assertEquals(result, expected);
	});
});
