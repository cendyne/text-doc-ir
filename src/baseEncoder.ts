export function encodeBase(
  keys: string[],
  num: number,
  shift: boolean,
): string {
  const output: string[] = [];
  if (shift && num == 0) {
    return "";
  }
  do {
    const mod = num % keys.length;
    let next = Math.floor((num - mod) / keys.length);
    if (shift) {
      if (mod == 0) {
        next--;
        output.push(keys[keys.length - 1]!);
      } else {
        output.push(keys[mod - 1]!);
      }
    } else {
      output.push(keys[mod]!);
    }
    num = next;
  } while (num > 0);
  return output.reverse().join("");
}

export const NUMERIC = "0123456789".split("");
export const UPPER_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const LOWER_ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");
