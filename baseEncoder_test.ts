import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { encodeBase, NUMERIC, UPPER_ALPHA } from "./baseEncoder.ts";

Deno.test({
  name: "Numeric",
  fn() {
    assertEquals("12", encodeBase(NUMERIC, 12, false));
    assertEquals("0", encodeBase(NUMERIC, 0, false));
    assertEquals("999", encodeBase(NUMERIC, 999, false));
  },
});

Deno.test({
  name: "Alpha - 1",
  fn() {
    assertEquals("", encodeBase(UPPER_ALPHA, 0, true));
    assertEquals("A", encodeBase(UPPER_ALPHA, 1, true));
    assertEquals("B", encodeBase(UPPER_ALPHA, 2, true));
    assertEquals("Y", encodeBase(UPPER_ALPHA, 25, true));
    assertEquals("Z", encodeBase(UPPER_ALPHA, 26, true));
  },
});

Deno.test({
  name: "Alpha - 2",
  fn() {
    assertEquals("AA", encodeBase(UPPER_ALPHA, 27, true));
    assertEquals("AB", encodeBase(UPPER_ALPHA, 28, true));
    assertEquals("AZ", encodeBase(UPPER_ALPHA, 52, true));
    assertEquals("BA", encodeBase(UPPER_ALPHA, 53, true));
  },
});
