import { expect, test } from "bun:test";
import { encodeBase, NUMERIC, UPPER_ALPHA } from "../baseEncoder.ts";

test("Numeric", () => {
  expect(encodeBase(NUMERIC, 12, false)).toEqual("12");
  expect(encodeBase(NUMERIC, 0, false)).toEqual("0");
  expect(encodeBase(NUMERIC, 999, false)).toEqual("999");
});

test("Alpha - 1", () => {
  expect(encodeBase(UPPER_ALPHA, 0, true)).toEqual("");
  expect(encodeBase(UPPER_ALPHA, 1, true)).toEqual("A");
  expect(encodeBase(UPPER_ALPHA, 2, true)).toEqual("B");
  expect(encodeBase(UPPER_ALPHA, 25, true)).toEqual("Y");
  expect(encodeBase(UPPER_ALPHA, 26, true)).toEqual("Z");
});

test("Alpha - 2", () => {
  expect(encodeBase(UPPER_ALPHA, 27, true)).toEqual("AA");
  expect(encodeBase(UPPER_ALPHA, 28, true)).toEqual("AB");
  expect(encodeBase(UPPER_ALPHA, 52, true)).toEqual("AZ");
  expect(encodeBase(UPPER_ALPHA, 53, true)).toEqual("BA");
});
